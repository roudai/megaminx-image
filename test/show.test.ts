// show：色を残すステッカーの番号（specs/002-show-option）
import { describe, expect, test } from 'vitest';
import { drawCanvas } from '../src/canvas.js';
import { PLL_CASES } from '../src/cases/index.js';
import { stickerColors, svg } from '../src/index.js';
import type { Color } from '../src/types.js';

const SIDES = Array.from({ length: 15 }, (_, i) => 11 + i);

/** 26 色のうち、側面の上段で show に無いものを 'd' にする（data-model.md「show の段」） */
function gray(colors: readonly Color[], show: readonly number[]): Color[] {
  return colors.map((c, i) => (i >= 11 && !show.includes(i) ? 'd' : c));
}

/** 同じことを stickers の上書きで書いたもの */
function grayStickers(show: readonly number[]): Record<number, Color> {
  return Object.fromEntries(SIDES.filter((i) => !show.includes(i)).map((i) => [i, 'd']));
}

// 描いた呼び出しを記録する偽物の canvas
function record(options: Parameters<typeof drawCanvas>[1]): unknown[] {
  const calls: unknown[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_, prop) => (...args: unknown[]) => calls.push([prop, ...args]),
    set: (_, prop, value) => (calls.push(['set', prop, value]), true),
  });
  drawCanvas({ width: 0, height: 0, getContext: () => ctx } as never, options);
  return calls;
}

describe('show：US1 指定したステッカーだけ色を残す', () => {
  test('[17, 18, 19]：F の 3 枚だけ残り、ほかの側面は d、上面は変わらない', () => {
    const out = stickerColors({ show: [17, 18, 19] });
    expect(out.slice(0, 11)).toEqual(Array(11).fill('u'));
    expect(out.slice(17, 20)).toEqual(['a', 'a', 'a']);
    for (const i of SIDES) if (i < 17 || i > 19) expect(out[i], `sticker ${i}`).toBe('d');
  });

  test('[]：側面の 15 枚がすべて d、上面は手順どおり', () => {
    const alg = "R U R' U'";
    const out = stickerColors({ alg, show: [] });
    expect(out.slice(11)).toEqual(Array(15).fill('d'));
    expect(out.slice(0, 11)).toEqual(stickerColors({ alg }).slice(0, 11));
  });

  test('11〜25 をすべて並べると、show なしと同じ', () => {
    expect(stickerColors({ alg: 'R', show: SIDES })).toEqual(stickerColors({ alg: 'R' }));
  });

  test('上面の番号・重なり・並び順で結果が変わらない', () => {
    const base = stickerColors({ alg: 'R', show: [17, 19] });
    expect(stickerColors({ alg: 'R', show: [0, 5, 17, 19] })).toEqual(base);
    expect(stickerColors({ alg: 'R', show: [17, 17, 19, 19] })).toEqual(base);
    expect(stickerColors({ alg: 'R', show: [19, 17] })).toEqual(base);
  });

  test('show: undefined は show なしと同じ', () => {
    expect(stickerColors({ alg: 'R', show: undefined })).toEqual(stickerColors({ alg: 'R' }));
    expect(svg({ alg: 'R', show: undefined })).toBe(svg({ alg: 'R' }));
  });

  test.each([[[]], [[17, 18, 19]], [[18, 19, 20, 21]], [[11, 25]]])(
    'SC-001：PLL の全ケースで show %j が「show に無い側面を d にしたもの」と同じ',
    (show) => {
      for (const c of PLL_CASES) {
        expect(stickerColors({ case: c.alg, show }), c.name).toEqual(gray(stickerColors({ case: c.alg }), show));
      }
    },
  );

  test('svg・drawCanvas・png：stickers で同じ灰色にしたときと同じ出力', async () => {
    const show = [18, 19, 20, 21];
    const base = { case: PLL_CASES[0].alg, size: 120, rotate: 2 };
    const same = { ...base, stickers: grayStickers(show) };
    expect(svg({ ...base, show })).toBe(svg(same));
    expect(svg({ ...base, show })).not.toBe(svg(base));
    expect(record({ ...base, show })).toEqual(record(same));
    const { png } = await import('../src/png.js');
    expect(Buffer.from(await png({ ...base, show })).equals(Buffer.from(await png(same)))).toBe(true);
  });
});

describe('show：US2 向き・上書きと組み合わせる（順：作り方 → rotate → show → stickers）', () => {
  test('rotate: 2, show: [18, 19, 20, 21]：番号は向きを変えた後の位置（PLL の全ケース）', () => {
    const show = [18, 19, 20, 21];
    for (const c of PLL_CASES) {
      expect(stickerColors({ case: c.alg, rotate: 2, show }), c.name).toEqual(
        gray(stickerColors({ case: c.alg, rotate: 2 }), show),
      );
    }
  });

  test('stickers は show の後：灰色にしたところも色を変えられる', () => {
    const out = stickerColors({ alg: 'R', show: [17], stickers: { 11: 'r' } });
    expect(out[11]).toBe('r');
    expect(out[12]).toBe('d');
  });

  test('state と一緒でも灰色にする', () => {
    const state = stickerColors({ alg: "R U R'" });
    expect(stickerColors({ state, show: [12] })).toEqual(gray(state, [12]));
  });

  test('start と case と一緒でも、start を付けた 26 色に show を当てる', () => {
    const base = { start: 'R U', case: "U' R'" };
    expect(stickerColors({ ...base, show: [14, 15] })).toEqual(gray(stickerColors(base), [14, 15]));
  });
});

describe('show：US3 誤った指定をエラーにする', () => {
  test.each([
    [18, '18'],
    ['18', '"18"'],
    [{}, '{}'],
    [null, 'null'],
    [true, 'true'],
  ])('配列でない %j → TypeError', (show, shown) => {
    const f = () => stickerColors({ show: show as never });
    expect(f).toThrow(TypeError);
    expect(f).toThrow(`"show" must be an array of sticker indices (got ${shown})`);
  });

  test.each([
    [26, '26'],
    [-1, '-1'],
    [1.5, '1.5'],
    [NaN, 'NaN'],
    ['18', '"18"'],
    [null, 'null'],
  ])('要素 %s → RangeError', (item, shown) => {
    const f = () => stickerColors({ show: [17, item] as never });
    expect(f).toThrow(RangeError);
    expect(f).toThrow(`Sticker index out of range: ${shown} (expected 0-25)`);
  });

  test('svg・drawCanvas・png でも同じエラー', async () => {
    const message = 'Sticker index out of range: 26 (expected 0-25)';
    expect(() => svg({ show: [26] })).toThrow(message);
    expect(() => record({ show: [26] })).toThrow(message);
    const { png } = await import('../src/png.js');
    await expect(png({ show: [26] })).rejects.toThrow(message);
  });
});
