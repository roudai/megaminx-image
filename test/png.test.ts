import { Resvg } from '@resvg/resvg-js';
import { describe, expect, test, vi } from 'vitest';
import { centroid, stickerPolygons } from '../src/geometry.js';
import { COLOR_CODES, stickerColors, svg } from '../src/index.js';

describe('png', () => {
  test('PNG のバイト列：先頭・大きさ・resvg と同じ・26 枚の色', async () => {
    const { png } = await import('../src/png.js');
    const options = { case: "R U R' U'", size: 300 };
    const bytes = await png(options);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect([...bytes.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    expect(view.getUint32(16)).toBe(300); // IHDR の幅
    expect(view.getUint32(20)).toBe(300); // IHDR の高さ

    const rendered = new Resvg(svg(options)).render();
    expect(Buffer.from(bytes).equals(rendered.asPng())).toBe(true);

    const colors = stickerColors({ case: "R U R' U'" });
    for (const p of stickerPolygons(300)) {
      const [x, y] = centroid(p.points).map(Math.round);
      const i = (y * rendered.width + x) * 4;
      const hex = '#' + [0, 1, 2].map((c) => rendered.pixels[i + c].toString(16).padStart(2, '0')).join('');
      expect(hex, `sticker ${p.index}`).toBe(COLOR_CODES[colors[p.index] as keyof typeof COLOR_CODES]);
    }
  });

  test('@resvg/resvg-js が無ければ入れ方を書いたエラー', async () => {
    vi.resetModules();
    vi.doMock('@resvg/resvg-js', () => {
      throw new Error("Cannot find package '@resvg/resvg-js'");
    });
    const { png } = await import('../src/png.js');
    await expect(png()).rejects.toThrow('Install "@resvg/resvg-js" to export PNG (npm install @resvg/resvg-js)');
    vi.doUnmock('@resvg/resvg-js');
    vi.resetModules();
  });

  test('設定の間違いは svg と同じエラー', async () => {
    const { png } = await import('../src/png.js');
    await expect(png({ size: -1 })).rejects.toThrow(RangeError);
  });
});
