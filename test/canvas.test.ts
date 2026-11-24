import { describe, expect, test } from 'vitest';
import { drawCanvas } from '../src/canvas.js';
import { lineWidths, outline, stickerPolygons } from '../src/geometry.js';
import { COLOR_CODES, stickerColors } from '../src/index.js';

type Call = [string, ...unknown[]];

// 呼び出しを記録する偽物の canvas
function fakeCanvas() {
  const calls: Call[] = [];
  const ctx: Record<string, unknown> = {};
  for (const name of ['clearRect', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke']) {
    ctx[name] = (...args: unknown[]) => calls.push([name, ...args]);
  }
  const state = new Proxy(ctx, {
    set(target, prop, value) {
      calls.push(['set:' + String(prop), value]);
      target[prop as string] = value;
      return true;
    },
  });
  const canvas = {
    width: 0,
    height: 0,
    getContext: (type: string) => (type === '2d' ? state : null),
  };
  return { canvas, calls };
}

describe('drawCanvas', () => {
  test('幅・高さ、線、26 枚、太い線（SVG と同じ点・順・太さ）', () => {
    const { canvas, calls } = fakeCanvas();
    const options = { alg: "R U R' U'", size: 300 };
    drawCanvas(canvas as never, options);
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(300);

    const sets = Object.fromEntries(calls.filter((c) => c[0].startsWith('set:')).map((c) => [c[0], c[1]]));
    expect(sets['set:lineJoin']).toBe('miter');
    expect(sets['set:miterLimit']).toBe(10);
    expect(sets['set:lineCap']).toBe('butt');

    // 26 枚：beginPath → moveTo → lineTo… → closePath → fill → stroke、fillStyle は 16 進
    const colors = stickerColors({ alg: "R U R' U'" });
    const polygons = stickerPolygons(300);
    const fills = calls.filter((c) => c[0] === 'set:fillStyle').map((c) => c[1]);
    expect(fills).toEqual(polygons.map((p) => COLOR_CODES[colors[p.index] as keyof typeof COLOR_CODES]));
    const pointsDrawn = calls.filter((c) => c[0] === 'moveTo' || c[0] === 'lineTo').map((c) => [c[1], c[2]]);
    const o = outline(300);
    expect(pointsDrawn).toEqual([
      ...polygons.flatMap((p) => p.points),
      ...o.inner,
      ...o.outer,
      ...o.dividers.flat(),
    ]);

    const widths = calls.filter((c) => c[0] === 'set:lineWidth').map((c) => c[1]);
    expect(widths).toEqual([lineWidths(300).thin, lineWidths(300).thick]);
    expect(calls.filter((c) => c[0] === 'fillRect')).toHaveLength(0);
  });

  test('背景を指定すると fillRect、線の色は 16 進', () => {
    const { canvas, calls } = fakeCanvas();
    drawCanvas(canvas as never, { background: 'w', lineColor: 'r' });
    expect(calls.find((c) => c[0] === 'fillRect')).toEqual(['fillRect', 0, 0, 200, 200]);
    expect(calls.filter((c) => c[0] === 'set:strokeStyle').map((c) => c[1])).toEqual(['#ff0000']);
    const bgIndex = calls.findIndex((c) => c[0] === 'fillRect');
    expect(calls[bgIndex - 1]).toEqual(['set:fillStyle', '#ffffff']);
  });

  test('document が無くても動く（渡された canvas だけを使う）', () => {
    expect('document' in globalThis).toBe(false);
    const { canvas } = fakeCanvas();
    expect(() => drawCanvas(canvas as never)).not.toThrow();
  });

  test('設定の間違いはエラー（svg と同じ）', () => {
    const { canvas } = fakeCanvas();
    expect(() => drawCanvas(canvas as never, { size: 0 })).toThrow(RangeError);
    expect(() => drawCanvas(canvas as never, { algorithm: 'R' } as never)).toThrow('Unknown option: "algorithm"');
  });

  test('2d の context が無ければエラー', () => {
    expect(() => drawCanvas({ getContext: () => null } as never)).toThrow('Canvas 2D context is not available');
  });
});
