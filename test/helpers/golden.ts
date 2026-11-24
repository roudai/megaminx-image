// サイトから書き出した正解データ（scripts/export-from-site.mjs）
import { readFileSync } from 'node:fs';

const load = (name: string) => JSON.parse(readFileSync(new URL(`../golden/${name}`, import.meta.url), 'utf8'));

export interface GoldenCase {
  name: string;
  group: string;
  alg: string;
  setup: string;
  case: string[];
  apply: string[];
  ollCase?: string[];
}
export type GoldenNotation =
  | { input: string; ok: true; colors: string[]; canonical: string; simplified: string }
  | { input: string; ok: false; error: { name: string; message: string } };

export const goldenCases: { pll: GoldenCase[]; oll: GoldenCase[] } = load('cases.json');
export const goldenNotation: GoldenNotation[] = load('notation.json').items;
export const goldenGeometry: { size: number; stickers: { u?: number; s?: number; points: [number, number][] }[] } =
  load('geometry.json');
