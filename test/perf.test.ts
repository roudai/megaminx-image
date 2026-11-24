// 1 枚 10ms 未満（SC-004）。npm run test:perf（CI の機械によって結果がぶれるので、npm test には入れない）
import { expect, test } from 'vitest';
import { OLL_CASES, PLL_CASES } from '../src/cases/index.js';
import { svg } from '../src/index.js';

test('1,000 枚の平均が 10ms 未満（読み込み直後の 1 回を除く）', () => {
  const cases = [...PLL_CASES, ...OLL_CASES];
  svg({ case: cases[0].alg }); // 読み込み直後の 1 回
  const n = 1000;
  const t0 = performance.now();
  for (let i = 0; i < n; i++) svg({ case: cases[i % cases.length].alg });
  const average = (performance.now() - t0) / n;
  console.log(`average: ${average.toFixed(3)} ms / image`);
  expect(average).toBeLessThan(10);
});
