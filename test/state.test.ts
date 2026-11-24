import { describe, expect, test } from 'vitest';
import { DEFAULT_SCHEME } from '../src/colors.js';
import { applyAlg, solved, topFaces } from '../src/state.js';
import type { Face } from '../src/types.js';
import { goldenNotation } from './helpers/golden.js';
import { randomAlg, rng } from './helpers/random.js';

const FACES = ['U', 'F', 'R', 'BR', 'BL', 'L', 'DR', 'DBR', 'B', 'DBL', 'DL', 'D'] as const;
const colorsOf = (state: readonly Face[]) => topFaces(state).map((f) => DEFAULT_SCHEME[f]);

describe('状態計算（サイトの js/megaminx-state.js と同じ）', () => {
  test('132 枚、各面 11 枚', () => {
    const s = solved();
    expect(s).toHaveLength(132);
    for (const f of FACES) expect(s.filter((c) => c === f)).toHaveLength(11);
  });

  test('各面と y は 5 回で元に戻り、1〜4 回では戻らない', () => {
    for (const f of [...FACES, 'y']) {
      let st = solved();
      for (let n = 1; n <= 5; n++) {
        st = applyAlg(f, { state: st });
        expect(st.join() === solved().join()).toBe(n === 5);
      }
    }
  });

  test('手順を回してから逆を回すと元に戻る', () => {
    const rand = rng(42);
    for (let i = 0; i < 50; i++) {
      const alg = randomAlg(rand, 20);
      expect(applyAlg(alg, { inverse: true, state: applyAlg(alg) }), alg).toEqual(solved());
    }
  });

  test('揃った状態の上面の並び（辺 2 の側面が F）', () => {
    // ucolor: 中心, 角0, 辺0, 角1, 辺1, …（data-model.md の並び）
    expect(topFaces(solved())).toEqual([
      'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U',
      'BL', 'BL', 'BL', 'L', 'L', 'L', 'F', 'F', 'F', 'R', 'R', 'R', 'BR', 'BR', 'BR',
    ]);
  });

  test('case：持ち替えの合計を打ち消す', () => {
    expect(applyAlg('y', { inverse: true, cancelRotation: true })).toEqual(solved());
    expect(applyAlg('y')).not.toEqual(solved());
  });

  test.each(goldenNotation.filter((g) => g.ok).map((g) => [JSON.stringify(g.input), g] as const))(
    '揃った状態から回した 26 色がサイトと同じ：%s',
    (_, g) => {
      if (!g.ok) return;
      expect(colorsOf(applyAlg(g.input))).toEqual(g.colors);
    },
  );
});
