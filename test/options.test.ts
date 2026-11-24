import { describe, expect, test } from 'vitest';
import { stickerColors, svg } from '../src/index.js';

// contracts/api.md のエラーの表
const both = [
  ['svg', (o: unknown) => svg(o as never)],
  ['stickerColors', (o: unknown) => stickerColors(o as never)],
] as const;

describe.each(both)('%s：設定の検証', (_, fn) => {
  test.each([
    [{ alg: 'R Q' }, SyntaxError, 'Invalid move: "Q" (at position 2)'],
    [{ alg: 'R 2' }, SyntaxError, 'Invalid move: "2" (at position 2)'],
    [{ case: '(R U' }, SyntaxError, 'Missing closing parenthesis (opened at position 0)'],
    [{ alg: "R U R' U')" }, SyntaxError, 'Unmatched ")" (at position 9)'],
    [{ start: 'X' }, SyntaxError, 'Invalid move: "X" (at position 0)'],
    [{ scheme: { U: 'orange' } }, TypeError, 'Unknown color: "orange"'],
    [{ scheme: { FR: 'o' } }, TypeError, 'Unknown face: "FR"'],
    [{ case: 'R', scheme: { U: 'u' } }, TypeError, 'No color set for face: '],
    [{ alg: 'R', case: 'R' }, TypeError, 'Use only one of "alg", "case" and "state"'],
    [{ start: 'R', state: Array(26).fill('u') }, TypeError, '"start" cannot be used with "state"'],
    [{ algorithm: 'R' }, TypeError, 'Unknown option: "algorithm"'],
    [{ alg: 1 }, TypeError, '"alg" must be a string (got 1)'],
    [{ case: null }, TypeError, '"case" must be a string (got null)'],
    [{ start: ['R'] }, TypeError, '"start" must be a string (got ["R"])'],
    [{ scheme: 'abc' }, TypeError, '"scheme" must be an object (got "abc")'],
  ])('%j → %s: %s', (options, type, message) => {
    expect(() => fn(options)).toThrow(type);
    expect(() => fn(options)).toThrow(message);
  });

  test('設定はオブジェクト', () => {
    expect(() => fn('R U')).toThrow(TypeError);
    expect(() => fn('R U')).toThrow('Options must be an object (got "R U")');
    expect(() => fn(null)).toThrow('Options must be an object (got null)');
  });

  test('値が undefined の設定は無いのと同じ', () => {
    expect(() => fn({ alg: undefined, case: 'R' })).not.toThrow();
  });
});

describe('svg だけの設定', () => {
  test.each([
    [{ size: 0 }, RangeError, '"size" must be a positive finite number (got 0)'],
    [{ size: -1 }, RangeError, '"size" must be a positive finite number (got -1)'],
    [{ size: NaN }, RangeError, '"size" must be a positive finite number (got NaN)'],
    [{ size: Infinity }, RangeError, '"size" must be a positive finite number (got Infinity)'],
    [{ size: '200' }, RangeError, '"size" must be a positive finite number (got "200")'],
    [{ lineColor: 'black' }, TypeError, 'Unknown color: "black"'],
    [{ background: 'none' }, TypeError, 'Unknown color: "none"'],
  ])('%j → %s: %s', (options, type, message) => {
    expect(() => svg(options as never)).toThrow(type);
    expect(() => svg(options as never)).toThrow(message);
  });

  test('stickerColors は見た目の設定を知らない設定としてエラーにする', () => {
    expect(() => stickerColors({ size: 200 } as never)).toThrow('Unknown option: "size"');
  });

  test('background: null は透明', () => {
    expect(svg({ background: null })).not.toContain('<rect');
  });
});
