import { describe, expect, test } from 'vitest';
import { ollScheme, stickerColors } from '../src/index.js';
import { goldenCases } from './helpers/golden.js';
import { randomAlg, rng } from './helpers/random.js';

// data-model.md「画像の向き」の付け替え：U を 1 回回すと、頂点 k の位置に頂点 k+1 の色が来る
function rotateBy<T>(colors: readonly T[], k: number): T[] {
  let out = colors.slice();
  for (let t = 0; t < ((k % 5) + 5) % 5; t++) {
    const prev = out;
    out = prev.map((_, i) => {
      if (i === 0) return prev[0];
      if (i <= 10) {
        const j = (i - 1) % 2;
        const v = Math.floor((i - 1) / 2);
        return prev[1 + j + 2 * ((v + 1) % 5)];
      }
      const j = (i - 11) % 3;
      const e = Math.floor((i - 11) / 3);
      return prev[11 + j + 3 * ((e + 1) % 5)];
    });
  }
  return out;
}

describe('OLL 用の配色', () => {
  test('ollScheme：U だけ残し、ほかは d', () => {
    expect(ollScheme()).toEqual({ U: 'u', F: 'd', R: 'd', BR: 'd', BL: 'd', L: 'd', DR: 'd', DBR: 'd', B: 'd', DBL: 'd', DL: 'd', D: 'd' });
    expect(ollScheme({ U: 'y' }).U).toBe('y');
    expect(ollScheme({ U: '#ABCDEF' }).U).toBe('#abcdef');
    expect(() => ollScheme({ U: 'orange' } as never)).toThrow('Unknown color: "orange"');
    expect(() => ollScheme({ F: 'a' })).toThrow('No color set for face: U');
  });

  test.each(goldenCases.oll.map((c) => [c.name, c] as const))('サイトと同じ：%s', (_, c) => {
    expect(stickerColors({ case: c.alg, scheme: ollScheme() })).toEqual(c.ollCase);
  });
});

describe('state：26 色の直接指定', () => {
  const colors = Array.from({ length: 26 }, (_, i) => (i % 2 ? 'r' : '#ABCDEF')) as never[];
  test('そのまま返す（16 進は小文字に）', () => {
    expect(stickerColors({ state: colors })).toEqual(colors.map((c) => (c === 'r' ? 'r' : '#abcdef')));
  });
  test.each([25, 27, 0])('%i 色は RangeError', (n) => {
    expect(() => stickerColors({ state: Array(n).fill('u') })).toThrow(RangeError);
    expect(() => stickerColors({ state: Array(n).fill('u') })).toThrow(`"state" must have 26 colors (got ${n})`);
  });
  test('配列でなければ TypeError、知らない色は TypeError', () => {
    expect(() => stickerColors({ state: 'uuu' as never })).toThrow('"state" must be an array of 26 colors (got "uuu")');
    expect(() => stickerColors({ state: [...Array(25).fill('u'), 'orange'] })).toThrow('Unknown color: "orange"');
  });
});

describe('stickers：上書き', () => {
  test('番号の色だけ変わる', () => {
    const base = stickerColors({ alg: 'R U' });
    const out = stickerColors({ alg: 'R U', stickers: { 0: 'r', 25: '#123ABC' } });
    expect(out).toEqual(base.map((c, i) => (i === 0 ? 'r' : i === 25 ? '#123abc' : c)));
  });
  test.each([['26'], ['-1'], ['1.5'], ['a']])('番号 %s は RangeError', (key) => {
    expect(() => stickerColors({ stickers: { [key]: 'r' } as never })).toThrow(RangeError);
    expect(() => stickerColors({ stickers: { [key]: 'r' } as never })).toThrow(`Sticker index out of range: ${key} (expected 0-25)`);
  });
  test('色の検証・オブジェクトでなければ TypeError', () => {
    expect(() => stickerColors({ stickers: { 1: 'orange' } as never })).toThrow('Unknown color: "orange"');
    expect(() => stickerColors({ stickers: 'r' as never })).toThrow('"stickers" must be an object (got "r")');
  });
});

describe('rotate：向き', () => {
  test('alg の後ろに U を k 回足したのと同じ（ランダム 100 件 × k）', () => {
    const rand = rng(11);
    for (let i = 0; i < 100; i++) {
      const alg = randomAlg(rand, 15);
      for (const k of [0, 1, 2, 3, 4, -1, 5, 7]) {
        const m = ((k % 5) + 5) % 5;
        expect(stickerColors({ alg, rotate: k }), `${alg} / ${k}`).toEqual(stickerColors({ alg: alg + ' U'.repeat(m) }));
      }
    }
  });

  test.each([...goldenCases.pll, ...goldenCases.oll].map((c) => [c.name, c] as const))('410 件の setup：%s', (_, c) => {
    expect(stickerColors({ alg: c.setup, rotate: 2 })).toEqual(stickerColors({ alg: c.setup + ' U U' }));
  });

  test('case・state は向き 0 の結果を付け替えたもの', () => {
    const alg = "R U R' U' R' F R2 U' R' U' R U R' F'";
    for (const k of [1, 2, 3, 4]) {
      expect(stickerColors({ case: alg, rotate: k })).toEqual(rotateBy(stickerColors({ case: alg }), k));
      const state = stickerColors({ alg });
      expect(stickerColors({ state, rotate: k })).toEqual(rotateBy(state, k));
    }
  });

  test('上書きは回したあとの位置', () => {
    expect(stickerColors({ rotate: 1, stickers: { 1: 'r' } })[1]).toBe('r');
    expect(stickerColors({ alg: 'R', rotate: 1, stickers: { 1: 'r' } })).toEqual(
      stickerColors({ alg: 'R U', stickers: { 1: 'r' } }),
    );
  });

  test.each([[0.5], [NaN], ['1'], [Infinity]])('%s は RangeError', (k) => {
    expect(() => stickerColors({ rotate: k as never })).toThrow(RangeError);
    expect(() => stickerColors({ rotate: k as never })).toThrow(`"rotate" must be an integer (got ${typeof k === 'string' ? JSON.stringify(k) : String(k)})`);
  });
});
