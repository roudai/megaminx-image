// 矢印の確かめと形（specs/003-arrows の data-model.md）。svg.ts・canvas.ts が同じ形を同じ順で描く。
// 長さは Math.sqrt（IEEE 754 で正しく丸めると決まっている）で求め、Math.hypot は使わない。
// 出す座標はすべて小数第 2 位に丸めるので、どの環境でも同じ数値になる（原則 IV・research.md R2）。
import { centroid, round, stickerPolygons, type Point } from './geometry.js';
import { describe } from './options.js';

const COUNT = 26;

/** 大きさ 200 での寸法（大きさに比例させる） */
const LINE = 3; // 線の太さ
const HEAD_LENGTH = 12; // 矢じりの長さ
const HEAD_WIDTH = 11; // 矢じりの幅
const GAP = 7; // ステッカーの中心から離す距離
const HALO = 1.5; // 白い縁取り（片側）

/** まとめた 1 本 */
export interface Arrow {
  readonly from: number;
  readonly to: number;
  /** 行きと帰りの両方がある（両端に矢じり） */
  readonly both: boolean;
}

/** 大きさ size の図の上の、1 本の矢印の形 */
export interface ArrowShape {
  /** 線の 2 点 */
  readonly line: readonly [Point, Point];
  /** 矢じりの三角形（先・底の 2 点） */
  readonly heads: readonly (readonly [Point, Point, Point])[];
}

/** 矢印の線の太さ・縁取りの太さ（lineWidths と同じく丸める） */
export function arrowWidths(size: number): { line: number; halo: number; haloLine: number } {
  const k = size / 200;
  return { line: round(LINE * k), halo: round(2 * HALO * k), haloLine: round((LINE + 2 * HALO) * k) };
}

/** arrows の入力を確かめ、描く 1 本ずつの並びにする */
export function checkArrows(arrows: unknown): Arrow[] {
  if (arrows === undefined) return [];
  if (!Array.isArray(arrows)) {
    throw new TypeError(`"arrows" must be an array of [from, to] pairs (got ${describe(arrows)})`);
  }
  for (const arrow of arrows) {
    if (!Array.isArray(arrow) || arrow.length !== 2 || arrow.some((v) => typeof v !== 'number')) {
      throw new TypeError(`Each arrow must be [from, to] (got ${describe(arrow)})`);
    }
    for (const index of arrow as number[]) {
      if (!Number.isInteger(index) || index < 0 || index >= COUNT) {
        throw new RangeError(`Sticker index out of range: ${describe(index)} (expected 0-${COUNT - 1})`);
      }
    }
    if (arrow[0] === arrow[1]) {
      throw new RangeError(`An arrow must connect two different stickers (got ${describe(arrow)})`);
    }
  }
  // 入力の順に見て、同じ矢印は 1 本に、行きと帰りは先に出た方を両矢印にする（research.md R5）
  const out: { from: number; to: number; both: boolean }[] = [];
  for (const [from, to] of arrows as [number, number][]) {
    if (out.some((a) => a.from === from && a.to === to)) continue;
    const back = out.find((a) => a.from === to && a.to === from);
    if (back) back.both = true;
    else out.push({ from, to, both: false });
  }
  return out;
}

/** 大きさ size の図の上の、矢印の形（data-model.md「形」） */
export function arrowShapes(size: number, arrows: readonly Arrow[]): ArrowShape[] {
  const k = size / 200;
  const centers = new Map(stickerPolygons(size).map((p) => [p.index, centroid(p.points)]));
  return arrows.map(({ from, to, both }) => {
    const [x1, y1] = centers.get(from)!;
    const [x2, y2] = centers.get(to)!;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / length;
    const uy = dy / length;
    const gap = GAP * k;
    // 両端を離した後の長さに矢じりが入らなければ、長さと幅を同じ割合で縮める（research.md R3）
    const count = both ? 2 : 1;
    const fit = Math.min(1, (length - 2 * gap) / (count * HEAD_LENGTH * k));
    const h = HEAD_LENGTH * k * fit;
    const w = HEAD_WIDTH * k * fit;

    const start: Point = [x1 + ux * gap, y1 + uy * gap];
    const end: Point = [x2 - ux * gap, y2 - uy * gap];
    // 先 tip、向き (dx, dy) の矢じり
    const head = (tip: Point, dx: number, dy: number): [Point, Point, Point] => {
      const bx = tip[0] - dx * h;
      const by = tip[1] - dy * h;
      return [pt(tip[0], tip[1]), pt(bx - (dy * w) / 2, by + (dx * w) / 2), pt(bx + (dy * w) / 2, by - (dx * w) / 2)];
    };
    const lineStart: Point = both ? [start[0] + ux * h, start[1] + uy * h] : start;
    return {
      line: [pt(lineStart[0], lineStart[1]), pt(end[0] - ux * h, end[1] - uy * h)],
      heads: both ? [head(end, ux, uy), head(start, -ux, -uy)] : [head(end, ux, uy)],
    };
  });
}

const pt = (x: number, y: number): Point => [round(x), round(y)];
