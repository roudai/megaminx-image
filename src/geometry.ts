// 画像の形（data-model.md「画像の形」・research.md R5）。
// サイトの js/megaminx-draw.js の stickers・draw と同じ多角形・同じ描く順。
// 座標は大きさ 1 の表（geometry-table.ts）に大きさを掛け、小数第 2 位に丸める。
// 三角関数を実行時に使わないので、どの環境でも同じ数値になる（原則 IV）。
import { UNIT, type Point } from './geometry-table.js';

export type { Point };

/** 小数第 2 位に丸める */
export function round(v: number): number {
  return Math.round(v * 100) / 100;
}

const scale = (p: Point, size: number): Point => [round(p[0] * size), round(p[1] * size)];

/** 1 枚のステッカーの多角形。index は 26 色の並びの番号 */
export interface StickerPolygon {
  readonly index: number;
  readonly points: readonly Point[];
}

const prev = (k: number) => (k + 4) % 5;
const center = (k: number) => UNIT.center[k % 5];
const inner = (k: number) => UNIT.inner[k];
const outer = (k: number) => UNIT.outer[k];
const edgeIn = (k: number, l: 0 | 1) => UNIT.edgeIn[k][l];
const edgeOut = (k: number, l: 0 | 1) => UNIT.edgeOut[k][l];

const upCorner = (k: number) => [center(k), edgeIn(prev(k), 1), inner(k), edgeIn(k, 0)];
const upEdge = (k: number) => [center(k), edgeIn(k, 0), edgeIn(k, 1), center(k + 1)];
const sideCornerLeft = (k: number) => [inner(k), outer(k), edgeOut(k, 0), edgeIn(k, 0)];
const sideCornerRight = (k: number) => [inner(k), outer(k), edgeOut(prev(k), 1), edgeIn(prev(k), 1)];
const sideEdge = (k: number) => [edgeIn(k, 0), edgeOut(k, 0), edgeOut(k, 1), edgeIn(k, 1)];

// 大きさ 1 の 26 枚（サイトの描く順）
const UNIT_STICKERS: readonly { index: number; points: readonly Point[] }[] = (() => {
  const list = [{ index: 0, points: [0, 1, 2, 3, 4].map(center) }];
  for (let k = 0; k < 5; k++) {
    list.push({ index: 1 + 2 * k, points: upCorner(k) }, { index: 2 + 2 * k, points: upEdge(k) });
  }
  for (let k = 0; k < 5; k++) {
    list.push(
      { index: 11 + 3 * k, points: sideCornerLeft(k) },
      { index: 12 + 3 * k, points: sideEdge(k) },
      { index: 13 + 3 * k, points: sideCornerRight((k + 1) % 5) },
    );
  }
  return list;
})();

/** 大きさ size の 26 枚の多角形（サイトの描く順） */
export function stickerPolygons(size: number): StickerPolygon[] {
  return UNIT_STICKERS.map((s) => ({ index: s.index, points: s.points.map((p) => scale(p, size)) }));
}

/** 太い線：U 面の外周・側面の外周の五角形と、側面の区切り 5 本（U 面の外周の頂点 k → 側面の外周の頂点 k） */
export function outline(size: number): {
  inner: Point[];
  outer: Point[];
  dividers: [Point, Point][];
} {
  const ks = [0, 1, 2, 3, 4];
  const innerPts = ks.map((k) => scale(inner(k), size));
  const outerPts = ks.map((k) => scale(outer(k), size));
  return { inner: innerPts, outer: outerPts, dividers: ks.map((k) => [innerPts[k], outerPts[k]]) };
}

/** 線の太さ（大きさ 200 のとき 細い線 2・太い線 4） */
export function lineWidths(size: number): { thin: number; thick: number } {
  return { thin: round(size / 100), thick: round(size / 50) };
}

/** 多角形の真ん中（頂点の平均）。画素で色を確かめるテストに使う */
export function centroid(points: readonly Point[]): Point {
  const n = points.length;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}
