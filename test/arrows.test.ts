// arrows：ステッカーからステッカーへの矢印（specs/003-arrows）
import { readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { describe, expect, test } from 'vitest';
import { drawCanvas } from '../src/canvas.js';
import { PLL_CASES } from '../src/cases/index.js';
import { centroid, round, stickerPolygons } from '../src/geometry.js';
import { stickerColors, svg } from '../src/index.js';
import type { ImageOptions } from '../src/types.js';

const caseOf = (name: string) => PLL_CASES.find((c) => c.name === name)!.alg;
const H1 = caseOf('H1+');
const H1_ARROWS: [number, number][] = [
  [18, 15],
  [15, 12],
  [12, 24],
  [24, 21],
  [21, 18],
];

/** SVG の矢印の部分（太い線の </g> より後、</svg> の前）。無ければ '' */
function arrowPart(s: string): string {
  const start = s.indexOf('<g fill="#ffffff"');
  return start < 0 ? '' : s.slice(start, -'</svg>'.length);
}

/** 文字列の中の数を順に取り出す（属性の stroke-width なども含む） */
const numbers = (s: string) => [...s.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));

/** path の d の中の点だけを取り出す */
function pathPoints(part: string): number[][] {
  return [...part.matchAll(/ d="([^"]*)"/g)].map((m) => numbers(m[1]));
}

// 描いた呼び出しを記録する偽物の canvas
function record(options: ImageOptions): unknown[][] {
  const calls: unknown[][] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_, prop) => (...args: unknown[]) => calls.push([prop, ...args]),
    set: (_, prop, value) => (calls.push(['set', prop, value]), true),
  });
  drawCanvas({ width: 0, height: 0, getContext: () => ctx } as never, options);
  return calls;
}

describe('arrows：US1 ステッカーの間に矢印を描く', () => {
  test('省いたとき・[] のときは、1.1.0 と同じ出力', () => {
    const solved = readFileSync(new URL('./svg/solved-200.svg', import.meta.url), 'utf8').trim();
    expect(svg({ arrows: [] })).toBe(solved);
    expect(svg({ arrows: undefined })).toBe(solved);
    expect(svg({ case: H1, arrows: [] })).toBe(svg({ case: H1 }));
    expect(record({ case: H1, arrows: [] })).toEqual(record({ case: H1 }));
  });

  test('H1+ の 5 本：SVG のスナップショット、矢印の部分は太い線の後', () => {
    const s = svg({ case: H1, arrows: H1_ARROWS });
    expect(s).toMatchSnapshot();
    expect(s.startsWith(svg({ case: H1 }).slice(0, -'</svg>'.length))).toBe(true);
    const part = arrowPart(s);
    expect(part).toMatch(/^<g fill="#ffffff" stroke="#ffffff" stroke-linejoin="miter" stroke-miterlimit="10">/);
    expect(part).toContain('<g fill="#000000" stroke="#000000" stroke-linejoin="miter" stroke-miterlimit="10">');
    expect(part.match(/<g /g)).toHaveLength(2);
  });

  test('1 本の矢印の形：中心から 7 離れ、矢じりの長さ 12・幅 11（大きさ 200）', () => {
    const [from, to] = [18, 12];
    const c = Object.fromEntries(stickerPolygons(200).map((p) => [p.index, centroid(p.points)]));
    const [x1, y1] = c[from];
    const [x2, y2] = c[to];
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
    const s = [x1 + ux * 7, y1 + uy * 7];
    const e = [x2 - ux * 7, y2 - uy * 7];
    const base = [e[0] - ux * 12, e[1] - uy * 12];
    const expectedLine = [s[0], s[1], base[0], base[1]].map(round);
    const expectedHead = [e[0], e[1], base[0] - uy * 5.5, base[1] + ux * 5.5, base[0] + uy * 5.5, base[1] - ux * 5.5].map(round);

    const [haloLine, haloHead, line, head] = pathPoints(arrowPart(svg({ arrows: [[from, to]] })));
    expect(line).toEqual(expectedLine);
    expect(head).toEqual(expectedHead);
    expect(haloLine).toEqual(line);
    expect(haloHead).toEqual(head);
    expect(arrowPart(svg({ arrows: [[from, to]] }))).toContain('stroke-width="6"');
    expect(arrowPart(svg({ arrows: [[from, to]] }))).toContain('stroke-width="3"');
  });

  test('大きさ 100 では、座標がほぼ半分', () => {
    const big = pathPoints(arrowPart(svg({ arrows: H1_ARROWS, size: 200 })));
    const small = pathPoints(arrowPart(svg({ arrows: H1_ARROWS, size: 100 })));
    big.forEach((ps, i) => ps.forEach((v, j) => expect(Math.abs(small[i][j] - v / 2)).toBeLessThanOrEqual(0.02)));
  });

  test('SC-002：H1+ の図の色から求めた「揃えると行く位置」が、README の 5 本と一致', () => {
    const solved = stickerColors();
    const colors = stickerColors({ case: H1 });
    const edges = [12, 15, 18, 21, 24];
    const moves = edges
      .map((p) => [p, edges.find((q) => solved[q] === colors[p])!] as [number, number])
      .filter(([p, q]) => p !== q);
    expect(new Set(moves.map((m) => m.join('>')))).toEqual(new Set(H1_ARROWS.map((m) => m.join('>'))));
  });

  test('canvas：SVG と同じ点・同じ順・同じ太さ。PNG：SVG を描いたものと同じ', async () => {
    const options = { case: H1, arrows: H1_ARROWS, size: 150 };
    const base = record({ case: H1, size: 150 });
    const calls = record(options);
    expect(calls.slice(0, base.length)).toEqual(base);
    const extra = calls.slice(base.length);
    const points = extra.filter((c) => c[0] === 'moveTo' || c[0] === 'lineTo').flatMap((c) => c.slice(1));
    expect(points).toEqual(pathPoints(arrowPart(svg(options))).flat());
    const widths = extra.filter((c) => c[0] === 'set' && c[1] === 'lineWidth').map((c) => c[2]);
    expect(widths).toEqual(numbers(arrowPart(svg(options)).match(/stroke-width="[^"]*"/g)!.join(' ')));

    const { png } = await import('../src/png.js');
    const bytes = Buffer.from(await png(options));
    expect(bytes.equals(new Resvg(svg(options)).render().asPng())).toBe(true);
  });
});

/** 色の矢印の path（線・矢じり）を、線 1 本・矢じり 1 つずつの数の並びに分ける */
function shapesOf(s: string): { lines: number[][]; heads: number[][] } {
  const [, , line, head] = pathPoints(arrowPart(s));
  const chunk = (xs: number[], n: number) => Array.from({ length: xs.length / n }, (_, i) => xs.slice(i * n, i * n + n));
  return { lines: chunk(line ?? [], 4), heads: chunk(head ?? [], 6) };
}

const dist = (a: readonly number[], b: readonly number[]) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);

describe('arrows：US2 行きと帰りを 1 本の両矢印にまとめる', () => {
  test('[[12, 15], [15, 12]]：線 1 本・矢じり 2 つ。線の両端は矢じりの底の真ん中', () => {
    const { lines, heads } = shapesOf(svg({ arrows: [[12, 15], [15, 12]] }));
    expect(lines).toHaveLength(1);
    expect(heads).toHaveLength(2);
    const mid = (h: number[]) => [(h[2] + h[4]) / 2, (h[3] + h[5]) / 2];
    const [a, b] = [lines[0].slice(0, 2), lines[0].slice(2)];
    expect(dist(b, mid(heads[0]))).toBeLessThan(0.02);
    expect(dist(a, mid(heads[1]))).toBeLessThan(0.02);
  });

  test('同じ矢印の重なりは 1 本', () => {
    expect(svg({ arrows: [[12, 15], [12, 15]] })).toBe(svg({ arrows: [[12, 15]] }));
  });

  test('離れて書いた行きと帰りもまとめ、描く順は先に出た方の位置', () => {
    const { lines, heads } = shapesOf(svg({ arrows: [[12, 15], [18, 21], [15, 12]] }));
    expect(lines).toHaveLength(2);
    expect(heads).toHaveLength(3);
    expect(lines[0]).toEqual(shapesOf(svg({ arrows: [[12, 15], [15, 12]] })).lines[0]);
    expect(lines[1]).toEqual(shapesOf(svg({ arrows: [[18, 21]] })).lines[0]);
  });

  test('隣り合う 2 枚の両矢印：矢じりが縮み、底が重ならない', () => {
    const { lines, heads } = shapesOf(svg({ arrows: [[2, 12], [12, 2]] }));
    expect(lines).toHaveLength(1);
    expect(heads).toHaveLength(2);
    const length = (h: number[]) => dist(h.slice(0, 2), [(h[2] + h[4]) / 2, (h[3] + h[5]) / 2]);
    expect(length(heads[0])).toBeLessThan(12);
    // 線の長さが 0 以上（2 つの矢じりの底が入れ違わない）：線の向きが、矢印の向きと同じ
    const [x1, y1, x2, y2] = lines[0];
    const [tx, ty] = heads[0].slice(0, 2);
    expect((x2 - x1) * (tx - x1) + (y2 - y1) * (ty - y1)).toBeGreaterThanOrEqual(0);
  });

  test('隣り合う 2 枚の片矢印：矢じりの長さが、両端を離した後の長さ以下', () => {
    const c = Object.fromEntries(stickerPolygons(200).map((p) => [p.index, centroid(p.points)]));
    const avail = dist(c[2], c[12]) - 14;
    const { heads } = shapesOf(svg({ arrows: [[2, 12]] }));
    const h = heads[0];
    expect(dist(h.slice(0, 2), [(h[2] + h[4]) / 2, (h[3] + h[5]) / 2])).toBeLessThanOrEqual(avail + 0.02);
  });
});

describe('arrows：US3 向き・show と組み合わせる', () => {
  test('rotate を変えても、矢印の部分は同じ（番号は回した後の図の上の位置）', () => {
    const a = svg({ case: H1, arrows: H1_ARROWS });
    const b = svg({ case: H1, arrows: H1_ARROWS, rotate: 2 });
    expect(a).not.toBe(b);
    expect(arrowPart(b)).toBe(arrowPart(a));
  });

  test('show と一緒：ステッカーは show だけのとき、矢印は arrows だけのときと同じ', () => {
    const show = [18, 19, 20, 21];
    const both = svg({ case: H1, show, arrows: H1_ARROWS });
    expect(both.startsWith(svg({ case: H1, show }).slice(0, -'</svg>'.length))).toBe(true);
    expect(arrowPart(both)).toBe(arrowPart(svg({ case: H1, arrows: H1_ARROWS })));
  });

  test('stickerColors は arrows・arrowColor を受け付けない', () => {
    expect(() => stickerColors({ arrows: [[1, 2]] } as never)).toThrow('Unknown option: "arrows"');
    expect(() => stickerColors({ arrowColor: 'r' } as never)).toThrow('Unknown option: "arrowColor"');
  });
});

describe('arrows：US5 誤った指定をエラーにする', () => {
  test.each([
    [18, '18'],
    ['a', '"a"'],
    [{}, '{}'],
    [null, 'null'],
  ])('配列でない %s → TypeError', (arrows, shown) => {
    const f = () => svg({ arrows: arrows as never });
    expect(f).toThrow(TypeError);
    expect(f).toThrow(`"arrows" must be an array of [from, to] pairs (got ${shown})`);
  });

  test.each([
    [18, '18'],
    [[1], '[1]'],
    [[1, 2, 3], '[1,2,3]'],
    [['1', 2], '["1",2]'],
    [null, 'null'],
  ])('要素 %j → TypeError', (arrow, shown) => {
    const f = () => svg({ arrows: [[1, 2], arrow] as never });
    expect(f).toThrow(TypeError);
    expect(f).toThrow(`Each arrow must be [from, to] (got ${shown})`);
  });

  test.each([
    [[26, 1], '26'],
    [[1, -1], '-1'],
    [[1.5, 2], '1.5'],
    [[NaN, 2], 'NaN'],
  ])('番号 %s → RangeError', (arrow, shown) => {
    const f = () => svg({ arrows: [arrow] as never });
    expect(f).toThrow(RangeError);
    expect(f).toThrow(`Sticker index out of range: ${shown} (expected 0-25)`);
  });

  test('同じ番号 → RangeError', () => {
    const f = () => svg({ arrows: [[5, 5]] });
    expect(f).toThrow(RangeError);
    expect(f).toThrow('An arrow must connect two different stickers (got [5,5])');
  });

  test('arrowColor が色でない → Unknown color（矢印が無くても）', () => {
    expect(() => svg({ arrowColor: 'orange' as never })).toThrow('Unknown color: "orange"');
    expect(() => svg({ arrows: [[1, 2]], arrowColor: 'orange' as never })).toThrow('Unknown color: "orange"');
  });

  test('svg・drawCanvas・png でも同じエラー', async () => {
    const message = 'An arrow must connect two different stickers (got [5,5])';
    expect(() => record({ arrows: [[5, 5]] })).toThrow(message);
    const { png } = await import('../src/png.js');
    await expect(png({ arrows: [[5, 5]] })).rejects.toThrow(message);
  });
});

describe('arrows：US4 色を変える', () => {
  test('arrowColor：矢印はその色、縁取りは白のまま。省くと黒、16 進は小文字', () => {
    const red = arrowPart(svg({ arrows: [[1, 2]], arrowColor: 'r' }));
    expect(red).toContain('<g fill="#ff0000" stroke="#ff0000"');
    expect(red).toContain('<g fill="#ffffff" stroke="#ffffff"');
    expect(arrowPart(svg({ arrows: [[1, 2]] }))).toContain('<g fill="#000000" stroke="#000000"');
    expect(arrowPart(svg({ arrows: [[1, 2]], arrowColor: '#12AB34' }))).toContain('<g fill="#12ab34" stroke="#12ab34"');
  });
});
