import { describe, expect, test } from 'vitest';
import { lineWidths, outline, round, stickerPolygons } from '../src/geometry.js';
import { UNIT } from '../src/geometry-table.js';
import { goldenGeometry } from './helpers/golden.js';

// サイトの js/megaminx-draw.js の geometry と同じ式（大きさ 1）
function siteUnit() {
  const origin = 0.5;
  const R = { center: (origin * 35) / 105, inner: (origin * 80) / 105, outer: (origin * 100) / 105, in: (origin * 65) / 105, out: (origin * 84) / 105 };
  const corner = (r: number, k: number) => {
    const t = (2 * Math.PI * k) / 5 + Math.PI / 2;
    return [origin + r * Math.cos(t), origin - r * Math.sin(t) + origin / 12];
  };
  const edge = (side: 'in' | 'out', k: number, l: number) => {
    const r = side === 'in' ? R.in : R.out;
    const gap = side === 'in' ? 0.043 : 0.081;
    const angle = l === 0 ? 0.4 * k + 0.2 - gap : 0.4 * k + 0.2 + gap;
    const t = angle * Math.PI + Math.PI / 2;
    return [origin + r * Math.cos(t), origin - r * Math.sin(t) + origin / 12];
  };
  const ks = [0, 1, 2, 3, 4];
  return {
    center: ks.map((k) => corner(R.center, k)),
    inner: ks.map((k) => corner(R.inner, k)),
    outer: ks.map((k) => corner(R.outer, k)),
    edgeIn: ks.map((k) => [edge('in', k, 0), edge('in', k, 1)]),
    edgeOut: ks.map((k) => [edge('out', k, 0), edge('out', k, 1)]),
  };
}

describe('形（research.md R5）', () => {
  test('大きさ 1 の表が計算式と 1e-12 まで合う', () => {
    const expected = siteUnit();
    const flat = (v: unknown): number[] => (Array.isArray(v) ? v.flatMap(flat) : [v as number]);
    for (const key of ['center', 'inner', 'outer', 'edgeIn', 'edgeOut'] as const) {
      const a = flat(UNIT[key]);
      const b = flat(expected[key]);
      expect(a).toHaveLength(b.length);
      a.forEach((x, i) => expect(Math.abs(x - b[i])).toBeLessThan(1e-12));
    }
  });

  test('round は小数第 2 位', () => {
    expect(round(1.234)).toBe(1.23);
    expect(round(1.235 + 1e-9)).toBe(1.24);
    expect(round(200)).toBe(200);
  });

  test('大きさ 200 の 26 枚がサイトと同じ順・同じ点（小数第 2 位）', () => {
    const ours = stickerPolygons(goldenGeometry.size);
    expect(ours).toHaveLength(26);
    ours.forEach((p, i) => {
      const site = goldenGeometry.stickers[i];
      expect(p.index).toBe(site.u != null ? site.u : 11 + site.s!);
      expect(p.points).toEqual(site.points.map(([x, y]) => [round(x), round(y)]));
    });
  });

  test('太い線：U 面の外周・側面の外周・区切り 5 本', () => {
    const o = outline(200);
    expect(o.inner).toHaveLength(5);
    expect(o.outer).toHaveLength(5);
    expect(o.dividers).toHaveLength(5);
    o.dividers.forEach(([a, b], k) => {
      expect(a).toEqual(o.inner[k]);
      expect(b).toEqual(o.outer[k]);
    });
  });

  test('線の太さは大きさに比例（200 で 2・4）', () => {
    expect(lineWidths(200)).toEqual({ thin: 2, thick: 4 });
    expect(lineWidths(400)).toEqual({ thin: 4, thick: 8 });
    expect(lineWidths(123.456)).toEqual({ thin: 1.23, thick: 2.47 });
  });
});
