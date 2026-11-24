import { describe, expect, test } from 'vitest';
import { COLOR_CODES, DEFAULT_SCHEME, assertColor, normalizeColor, resolveScheme } from '../src/colors.js';

describe('色（data-model.md）', () => {
  test('色コード 15 個と 16 進', () => {
    expect(COLOR_CODES).toEqual({
      d: '#696969', u: '#d3d3d3', p: '#ffc0cb', c: '#fffacd', a: '#00ffff', o: '#ffa500', l: '#7cfc00',
      b: '#1e90ff', y: '#ffff00', s: '#9400d3', g: '#2e8b57', r: '#ff0000', w: '#ffffff', x: '#000000', z: '#1b1b1b',
    });
    expect(Object.isFrozen(COLOR_CODES)).toBe(true);
  });

  test('既定の配色（サイトと同じ）', () => {
    expect(DEFAULT_SCHEME).toEqual({
      U: 'u', F: 'a', R: 'o', BR: 'l', BL: 'p', L: 'c', DR: 's', DBR: 'y', B: 'b', DBL: 'r', DL: 'g', D: 'w',
    });
    expect(Object.isFrozen(DEFAULT_SCHEME)).toBe(true);
  });

  test('色の検証：色コードと #rrggbb だけ', () => {
    expect(normalizeColor('o')).toBe('o');
    expect(normalizeColor('#FFA500')).toBe('#ffa500');
    for (const bad of ['orange', '#fff', 'O', '', '#ggg000', null, undefined, 1]) {
      expect(() => assertColor(bad, 'color')).toThrow(TypeError);
      expect(() => assertColor(bad, 'color')).toThrow(`Unknown color: ${JSON.stringify(bad)}`);
    }
  });

  test('配色の検証：知らない面・知らない色', () => {
    expect(resolveScheme({ U: 'u', F: '#ABCDEF' })).toEqual({ U: 'u', F: '#abcdef' });
    expect(() => resolveScheme({ FR: 'o' } as never)).toThrow('Unknown face: "FR"');
    expect(() => resolveScheme({ U: 'orange' } as never)).toThrow('Unknown color: "orange"');
  });
});
