import { describe, expect, test } from 'vitest';
import { stickerColors } from '../src/index.js';
import { goldenCases } from './helpers/golden.js';

const SOLVED = ['u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'p', 'p', 'p', 'c', 'c', 'c', 'a', 'a', 'a', 'o', 'o', 'o', 'l', 'l', 'l'];

describe('stickerColors：26 色の並び（data-model.md）', () => {
  test('揃った状態（番号 15〜17 が F の a）', () => {
    expect(stickerColors()).toEqual(SOLVED);
    expect(stickerColors().slice(17, 20)).toEqual(['a', 'a', 'a']);
  });

  test('start：その状態から計算する', () => {
    expect(stickerColors({ start: 'R U', alg: "U' R'" })).toEqual(SOLVED);
    expect(stickerColors({ start: 'R', case: 'R' })).toEqual(SOLVED);
    expect(stickerColors({ start: "R U R' U'" })).toEqual(stickerColors({ alg: "R U R' U'" }));
  });

  test('持ち替えの打ち消しは case だけ', () => {
    expect(stickerColors({ case: 'y' })).toEqual(SOLVED);
    expect(stickerColors({ alg: 'y' })).not.toEqual(SOLVED);
  });
});

describe('サイトと同じ 26 色（test/golden/cases.json、410 件）', () => {
  const all = [...goldenCases.pll, ...goldenCases.oll];
  test('件数', () => {
    expect(goldenCases.pll).toHaveLength(151);
    expect(goldenCases.oll).toHaveLength(259);
  });
  test.each(all.map((c) => [c.name, c] as const))('%s', (_, c) => {
    expect(stickerColors({ case: c.alg })).toEqual(c.case);
    expect(stickerColors({ alg: c.setup })).toEqual(c.apply);
  });
});
