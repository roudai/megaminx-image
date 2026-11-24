import { describe, expect, test } from 'vitest';
import { parseAlg } from '../src/notation.js';
import { goldenNotation } from './helpers/golden.js';

const moves = (alg: string) => parseAlg(alg).map((m) => `${m.face}:${m.turns}`).join(' ');

describe('parseAlg：読み方（contracts/notation.md）', () => {
  test('空の手順・空白だけ', () => {
    expect(parseAlg('')).toEqual([]);
    expect(parseAlg('   ')).toEqual([]);
  });

  test('回数は時計回り 72° 単位で 5 で割った余り、\' は逆', () => {
    expect(moves("R R' R2 R2' R'2 R3 R5 R0 R10")).toBe('R:1 R:4 R:2 R:3 R:3 R:3 R:0 R:0 R:0');
  });

  test('大文字・小文字を区別しない、別名、長い記号を先に読む', () => {
    expect(moves('br bl dr dl dbr dbl Dfr DFL Y')).toBe('BR:1 BL:1 DR:1 DL:1 DBR:1 DBL:1 DR:1 DL:1 y:1');
    expect(moves("RU2'DBR")).toBe('R:1 U:3 DBR:1');
  });

  test('全角の記号と区切り', () => {
    expect(moves('R’ U‘ F′ B´ L`')).toBe('R:4 U:4 F:4 B:4 L:4');
    expect(moves('（R U）2')).toBe('R:1 U:1 R:1 U:1');
    expect(moves('R　U、F,L\tD\nB')).toBe('R:1 U:1 F:1 L:1 D:1 B:1');
  });

  test('括弧：回数・逆・入れ子・空の括弧', () => {
    expect(moves("(R U R' U')2")).toBe('R:1 U:1 R:4 U:4 R:1 U:1 R:4 U:4');
    expect(moves("(R U)'")).toBe('U:4 R:4');
    expect(moves("(R U2)2'")).toBe('U:3 R:4 U:3 R:4');
    expect(moves("((R U)2 F)'")).toBe('F:4 U:4 R:4 U:4 R:4');
    expect(moves('() ()2 U')).toBe('U:1');
  });
});

describe('parseAlg：エラーの位置（元の文字列の 0 から数えた位置）', () => {
  const error = (alg: string) => {
    try {
      parseAlg(alg);
    } catch (e) {
      return e as Error;
    }
    throw new Error('エラーにならなかった: ' + alg);
  };

  test.each([
    ['R U Q', 'Invalid move: "Q" (at position 4)'],
    ['R　　Q', 'Invalid move: "Q" (at position 3)'],
    ['R 2', 'Invalid move: "2" (at position 2)'],
    ["R2'3 U", `Invalid move: "R2'3" (at position 0)`],
    ['(R U', 'Missing closing parenthesis (opened at position 0)'],
    ['(R (U', 'Missing closing parenthesis (opened at position 3)'],
    ['R U)', 'Unmatched ")" (at position 3)'],
  ])('%j → %s', (alg, message) => {
    const e = error(alg);
    expect(e).toBeInstanceOf(SyntaxError);
    expect(e.message).toBe(message);
  });
});

describe('parseAlg：サイトと同じ読み方（test/golden/notation.json）', () => {
  test.each(goldenNotation.map((g) => [JSON.stringify(g.input), g] as const))('%s', (_, g) => {
    if (g.ok) {
      expect(() => parseAlg(g.input)).not.toThrow();
    } else {
      expect(() => parseAlg(g.input)).toThrow(SyntaxError);
      try {
        parseAlg(g.input);
      } catch (e) {
        expect((e as Error).message.startsWith(g.error.message)).toBe(true);
      }
    }
  });
});
