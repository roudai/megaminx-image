// 入口 megaminx-image/canvas：canvas に描く（ブラウザ用の薄い層。research.md R8）。
// SVG と同じ点・同じ描く順・同じ太さ・同じ角の形（サイトの js/megaminx-draw.js の draw と同じ）。
// 渡された canvas の getContext('2d') だけを使い、document などのグローバルには触れない
// （OffscreenCanvas でも動く）。
import { arrowShapes, arrowWidths, checkArrows } from './arrows.js';
import { normalizeColor, toHex } from './colors.js';
import { lineWidths, outline, stickerPolygons, type Point } from './geometry.js';
import { IMAGE_KEYS, checkOptions } from './options.js';
import { resolveColors } from './stickers.js';
import type { ImageOptions } from './types.js';

/** drawCanvas が使う 2D の context の部分（CanvasRenderingContext2D・OffscreenCanvasRenderingContext2D） */
export interface Canvas2DContextLike {
  fillStyle: unknown;
  strokeStyle: unknown;
  lineWidth: number;
  lineJoin: unknown;
  lineCap: unknown;
  miterLimit: number;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  fill(): void;
  stroke(): void;
}

/** drawCanvas に渡せる canvas（HTMLCanvasElement・OffscreenCanvas） */
export interface CanvasLike {
  width: number;
  height: number;
  getContext(contextId: '2d'): unknown;
}

/** canvas の幅・高さを size にして、最後の層の画像を描く */
export function drawCanvas(canvas: CanvasLike, input?: ImageOptions): void {
  const options = checkOptions(input, IMAGE_KEYS);
  const size = options.size ?? 200;
  const line = toHex(normalizeColor(options.lineColor ?? '#000000'));
  const background = options.background == null ? null : toHex(normalizeColor(options.background));
  const colors = resolveColors(options);
  const shapes = arrowShapes(size, checkArrows(options.arrows));
  const arrowColor = toHex(normalizeColor(options.arrowColor ?? '#000000'));

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d') as Canvas2DContextLike | null;
  if (!ctx) throw new Error('Canvas 2D context is not available');

  ctx.lineJoin = 'miter';
  ctx.miterLimit = 10;
  ctx.lineCap = 'butt';
  ctx.clearRect(0, 0, size, size);
  if (background !== null) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
  }

  const path = (points: readonly Point[], close: boolean) => {
    ctx.moveTo(points[0][0], points[0][1]);
    for (const p of points.slice(1)) ctx.lineTo(p[0], p[1]);
    if (close) ctx.closePath();
  };

  // ステッカー：塗ってから細い線（サイトと同じ順）
  const widths = lineWidths(size);
  ctx.lineWidth = widths.thin;
  ctx.strokeStyle = line;
  for (const p of stickerPolygons(size)) {
    ctx.beginPath();
    path(p.points, true);
    ctx.fillStyle = toHex(colors[p.index]);
    ctx.fill();
    ctx.stroke();
  }

  // 太い線：U 面の外周・側面の外周・区切り 5 本
  const o = outline(size);
  ctx.lineWidth = widths.thick;
  ctx.beginPath();
  path(o.inner, true);
  ctx.stroke();
  ctx.beginPath();
  path(o.outer, true);
  ctx.stroke();
  ctx.beginPath();
  for (const d of o.dividers) path(d, false);
  ctx.stroke();

  // 矢印（SVG と同じ点・同じ順）：全部の白い縁取り → 全部の矢印
  if (shapes.length > 0) {
    const aw = arrowWidths(size);
    const heads = shapes.flatMap((a) => a.heads);
    const draw = (color: string, lineWidth: number, headStroke: number | null) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (const a of shapes) path(a.line, false);
      ctx.stroke();
      if (headStroke !== null) ctx.lineWidth = headStroke;
      ctx.beginPath();
      for (const h of heads) path(h, true);
      ctx.fill();
      if (headStroke !== null) ctx.stroke();
    };
    draw('#ffffff', aw.haloLine, aw.halo);
    draw(arrowColor, aw.line, null);
  }
}

export type { ImageOptions } from './types.js';
