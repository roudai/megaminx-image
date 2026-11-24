import { describe, expect, test } from 'vitest';
import { canonicalAlg, invertAlg, simplifyAlg } from '../src/index.js';
import { applyAlg, solved } from '../src/state.js';
import { goldenNotation } from './helpers/golden.js';
import { rng } from './helpers/random.js';

const readable = goldenNotation.filter((g) => g.ok);
const unreadable = goldenNotation.filter((g) => !g.ok);

describe('canonicalAlg（contracts/notation.md）', () => {
  test('例', () => {
    expect(canonicalAlg("r u bR' Y")).toBe("R U BR' y");
  });
  test.each(readable.map((g) => [JSON.stringify(g.input), g] as const))('サイトと同じ：%s', (_, g) => {
    if (g.ok) expect(canonicalAlg(g.input)).toBe(g.canonical);
  });
  test.each(unreadable.map((g) => [g.input]))('読めない手順は SyntaxError：%j', (input) => {
    expect(() => canonicalAlg(input)).toThrow(SyntaxError);
  });
});

describe('simplifyAlg', () => {
  test('例', () => {
    expect(simplifyAlg("R R' U U")).toBe('U2');
  });
  test.each(readable.map((g) => [JSON.stringify(g.input), g] as const))('サイトと同じ：%s', (_, g) => {
    if (g.ok) expect(simplifyAlg(g.input)).toBe(g.simplified);
  });
  test.each(unreadable.map((g) => [g.input]))('読めない手順は SyntaxError：%j', (input) => {
    expect(() => simplifyAlg(input)).toThrow(SyntaxError);
  });
});

// 括弧・回数・' を含むランダムな手順
function randomTreeAlg(rand: () => number, depth = 0): string {
  const faces = ['U', 'F', 'R', 'BR', 'BL', 'L', 'DR', 'DBR', 'B', 'DBL', 'DL', 'D', 'y'];
  const amounts = ['', "'", '2', "2'", "'2", '3', '5'];
  const n = 1 + Math.floor(rand() * 5);
  const items: string[] = [];
  for (let i = 0; i < n; i++) {
    if (depth < 2 && rand() < 0.25) {
      items.push('(' + randomTreeAlg(rand, depth + 1) + ')' + ['', '2', "'", "2'", "'3"][Math.floor(rand() * 5)]);
    } else {
      items.push(faces[Math.floor(rand() * faces.length)] + amounts[Math.floor(rand() * amounts.length)]);
    }
  }
  return items.join(' ');
}

describe('invertAlg', () => {
  test.each([
    ["R U (R' F)2 BR'", "BR (F' R)2 U' R'"],
    ['R3', 'R2'],
    ['R5 U', "U'"],
    ["(R U)2'", "(U' R')2'"],
    ['()', ''],
    ['() R', "R'"],
    ["r u bR' Y", "y' BR U' R'"],
    ["R2'", 'R2'],
  ])('%j → %j', (alg, inverse) => {
    expect(invertAlg(alg)).toBe(inverse);
  });

  test('手順を回してから逆を回すと元に戻る（ランダム 200 件）', () => {
    const rand = rng(7);
    for (let i = 0; i < 200; i++) {
      const alg = randomTreeAlg(rand);
      const inv = invertAlg(alg);
      expect(applyAlg(inv, { state: applyAlg(alg) }), `${alg} → ${inv}`).toEqual(solved());
    }
  });

  test.each(unreadable.map((g) => [g.input]))('読めない手順は SyntaxError：%j', (input) => {
    expect(() => invertAlg(input)).toThrow(SyntaxError);
  });
});
