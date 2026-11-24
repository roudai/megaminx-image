import { describe, expect, test } from 'vitest';
import { OLL_CASES, PLL_CASES } from '../src/cases/index.js';
import { goldenCases } from './helpers/golden.js';

describe('ケースのデータ（megaminx-image/cases）', () => {
  test.each([
    ['PLL', PLL_CASES, goldenCases.pll, 151],
    ['OLL', OLL_CASES, goldenCases.oll, 259],
  ] as const)('%s', (_, list, golden, count) => {
    expect(list).toHaveLength(count);
    expect(new Set(list.map((c) => c.name)).size).toBe(count);
    expect(Object.isFrozen(list)).toBe(true);
    list.forEach((c, i) => {
      expect(Object.keys(c)).toEqual(['name', 'group', 'alg', 'setup']);
      expect(Object.isFrozen(c)).toBe(true);
      const g = golden[i];
      expect(c).toEqual({ name: g.name, group: g.group, alg: g.alg, setup: g.setup });
    });
  });
});
