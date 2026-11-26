// SVG の文字列（contracts/api.md「SVG の形」・research.md R6）。
// サイトの canvas の描き方（js/megaminx-draw.js の draw）と同じ順・同じ太さ・同じ角の形。
// 要素と属性の順・空白は固定。数値は小数第 2 位に丸め、String(n) で書く（末尾の 0 は付かない）。
import { arrowShapes, arrowWidths, checkArrows } from './arrows.js';
import { normalizeColor, toHex } from './colors.js';
import { lineWidths, outline, round, stickerPolygons, type Point } from './geometry.js';
import { IMAGE_KEYS, checkOptions } from './options.js';
import { resolveColors } from './stickers.js';
import type { ImageOptions } from './types.js';

const num = (v: number) => String(v);
const points = (ps: readonly Point[]) => ps.map((p) => `${num(p[0])},${num(p[1])}`).join(' ');
const LINE_ATTRS = 'stroke-linejoin="miter" stroke-miterlimit="10"';

/** 最後の層の画像を SVG の文字列で返す */
export function svg(input?: ImageOptions): string {
  const options = checkOptions(input, IMAGE_KEYS);
  const size = options.size ?? 200;
  const line = toHex(normalizeColor(options.lineColor ?? '#000000'));
  const background = options.background == null ? null : toHex(normalizeColor(options.background));
  const colors = resolveColors(options);
  const arrowColor = toHex(normalizeColor(options.arrowColor ?? '#000000')); // 矢印が無くても色は確かめる
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
  out += '</g>';

  // 矢印（specs/003-arrows の contracts/api.md）：全部の白い縁取り → 全部の矢印。無ければ何も書かない
  const shapes = arrowShapes(size, checkArrows(options.arrows));
  if (shapes.length > 0) {
    const aw = arrowWidths(size);
    const lines = shapes.map((a) => `M ${num(a.line[0][0])} ${num(a.line[0][1])} L ${num(a.line[1][0])} ${num(a.line[1][1])}`).join(' ');
    const heads = shapes
      .flatMap((a) => a.heads)
      .map(([t, l, r]) => `M ${num(t[0])} ${num(t[1])} L ${num(l[0])} ${num(l[1])} L ${num(r[0])} ${num(r[1])} Z`)
      .join(' ');
    out += `<g fill="#ffffff" stroke="#ffffff" ${LINE_ATTRS}>`;
    out += `<path fill="none" stroke-width="${num(aw.haloLine)}" d="${lines}"/><path stroke-width="${num(aw.halo)}" d="${heads}"/></g>`;
    out += `<g fill="${arrowColor}" stroke="${arrowColor}" ${LINE_ATTRS}>`;
    out += `<path fill="none" stroke-width="${num(aw.line)}" d="${lines}"/><path stroke="none" d="${heads}"/></g>`;
  }
  return out + '</svg>';
}
