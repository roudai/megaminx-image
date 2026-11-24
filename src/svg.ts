// SVG の文字列（contracts/api.md「SVG の形」・research.md R6）。
// サイトの canvas の描き方（js/megaminx-draw.js の draw）と同じ順・同じ太さ・同じ角の形。
// 要素と属性の順・空白は固定。数値は小数第 2 位に丸め、String(n) で書く（末尾の 0 は付かない）。
import { normalizeColor, toHex } from './colors.js';
import { lineWidths, outline, round, stickerPolygons, type Point } from './geometry.js';
import { stickerColors } from './stickers.js';
import type { ImageOptions } from './types.js';

const num = (v: number) => String(v);
const points = (ps: readonly Point[]) => ps.map((p) => `${num(p[0])},${num(p[1])}`).join(' ');
const LINE_ATTRS = 'stroke-linejoin="miter" stroke-miterlimit="10"';

/** 最後の層の画像を SVG の文字列で返す */
export function svg(options: ImageOptions = {}): string {
  const size = options.size ?? 200;
  const line = toHex(normalizeColor(options.lineColor ?? '#000000'));
  const background = options.background == null ? null : toHex(normalizeColor(options.background));
  const colors = stickerColors(options);
  const widths = lineWidths(size);
  const s = num(round(size));

  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">`;
  if (background !== null) out += `<rect width="${s}" height="${s}" fill="${background}"/>`;

  out += `<g stroke="${line}" stroke-width="${num(widths.thin)}" ${LINE_ATTRS}>`;
  for (const p of stickerPolygons(size)) {
    out += `<polygon points="${points(p.points)}" fill="${toHex(colors[p.index])}"/>`;
  }
  out += '</g>';

  const o = outline(size);
  const d = o.dividers.map(([a, b]) => `M ${num(a[0])} ${num(a[1])} L ${num(b[0])} ${num(b[1])}`).join(' ');
  out += `<g fill="none" stroke="${line}" stroke-width="${num(widths.thick)}" ${LINE_ATTRS}>`;
  out += `<polygon points="${points(o.inner)}"/><polygon points="${points(o.outer)}"/><path d="${d}"/>`;
  out += '</g></svg>';
  return out;
}
