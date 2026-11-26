// ブラウザ 3 種で、Node.js と同じ SVG になるか（SC-006・原則 IV）。
// canvas と SVG の見た目が同じか（spec US4 の 3）も、26 枚の真ん中の画素の色で確かめる。
// npm run test:browser（ビルドしてから、dist/ をテスト用のサーバーで配って読む）
import { expect, test } from '@playwright/test';
import { centroid, stickerPolygons } from '../../dist/geometry.js';
import { COLOR_CODES, stickerColors, svg } from '../../dist/index.js';
import { OLL_CASES, PLL_CASES } from '../../dist/cases/index.js';

const all = [...PLL_CASES, ...OLL_CASES];
const INPUTS: Record<string, unknown>[] = [
  {},
  ...all.filter((_, i) => i % 20 === 0).map((c) => ({ case: c.alg })),
  { alg: "R U R' U'", rotate: 1 },
  { case: PLL_CASES[0].alg, rotate: 3, background: '#ffffff' },
  { alg: 'BR DBL y', size: 123.456 },
  { alg: 'R', size: 1000, lineColor: 'r' },
  { alg: 'U F', size: 57 },
  { state: Array.from({ length: 26 }, (_, i) => (i % 3 ? 'o' : '#12AB34')) },
  { case: OLL_CASES[5].alg, scheme: { U: 'y', F: 'd', R: 'd', BR: 'd', BL: 'd', L: 'd' } },
  { alg: "R U'", stickers: { 0: 'x', 25: 'z' } },
  { start: "R U R'", case: "F R U'" },
  { case: "(R U R' U')2 y'", background: 'w', size: 250 },
  // 矢印（specs/003-arrows。平方根と割り算を使うので、ブラウザーでも同じ文字列になるかを確かめる）
  { case: PLL_CASES.find((c) => c.name === 'H1+')!.alg, arrows: [[18, 15], [15, 12], [12, 24], [24, 21], [21, 18]] },
  { arrows: [[12, 15], [15, 12], [2, 12], [12, 2], [0, 25]], size: 123.456 },
  { case: PLL_CASES[3].alg, rotate: 2, show: [18, 19, 20, 21], arrows: [[19, 7], [3, 21]], arrowColor: 'r', size: 77 },
  { arrows: Array.from({ length: 25 }, (_, i) => [i, i + 1]), size: 1000 },
];

test.beforeEach(async ({ page }) => {
  await page.goto('/test/browser/blank.html');
});

test('Node.js と同じ SVG（1 文字も違わない）', async ({ page }) => {
  const expected = INPUTS.map((o) => svg(o as never));
  const actual = await page.evaluate(async (inputs) => {
    const m = await import('/dist/index.js' as string);
    return inputs.map((o: unknown) => m.svg(o));
  }, INPUTS);
  expect(actual).toHaveLength(expected.length);
  actual.forEach((s: string, i: number) => expect(s, JSON.stringify(INPUTS[i])).toBe(expected[i]));
});

test('canvas と SVG の 26 枚の真ん中の色', async ({ page }) => {
  const inputs = INPUTS.slice(0, 5).map((o) => ({ ...o, size: 300 }));
  const samples = inputs.map((o) => {
    const { size: _size, background: _bg, lineColor: _line, ...state } = o as Record<string, unknown>;
    const colors = stickerColors(state as never);
    return stickerPolygons(300).map((p) => {
      const [x, y] = centroid(p.points);
      const c = colors[p.index];
      return { x: Math.round(x), y: Math.round(y), hex: c.startsWith('#') ? c.toLowerCase() : COLOR_CODES[c as keyof typeof COLOR_CODES] };
    });
  });
  const result = await page.evaluate(
    async ({ inputs, samples }) => {
      const m = await import('/dist/index.js' as string);
      const { drawCanvas } = await import('/dist/canvas.js' as string);
      const hex = (d: Uint8ClampedArray) => '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
      const out: { canvas: string[]; svg: string[] }[] = [];
      for (let i = 0; i < inputs.length; i++) {
        const cv = document.createElement('canvas');
        drawCanvas(cv, inputs[i]);
        const img = new Image();
        img.src = URL.createObjectURL(new Blob([m.svg(inputs[i])], { type: 'image/svg+xml' }));
        await img.decode();
        const cv2 = document.createElement('canvas');
        cv2.width = cv2.height = 300;
        cv2.getContext('2d')!.drawImage(img, 0, 0);
        const read = (c: HTMLCanvasElement) => samples[i].map((s) => hex(c.getContext('2d')!.getImageData(s.x, s.y, 1, 1).data));
        out.push({ canvas: read(cv), svg: read(cv2) });
      }
      return out;
    },
    { inputs, samples },
  );
  const near = (a: string, b: string) =>
    [1, 3, 5].every((k) => Math.abs(parseInt(a.slice(k, k + 2), 16) - parseInt(b.slice(k, k + 2), 16)) <= 2);
  result.forEach((r, i) => {
    samples[i].forEach((s, j) => {
      expect(near(r.canvas[j], s.hex), `canvas ${i} sticker ${j}: ${r.canvas[j]} vs ${s.hex}`).toBe(true);
      expect(near(r.svg[j], s.hex), `svg ${i} sticker ${j}: ${r.svg[j]} vs ${s.hex}`).toBe(true);
    });
  });
});
