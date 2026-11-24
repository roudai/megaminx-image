import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { svg } from '../src/index.js';

const SOLVED_200 = readFileSync(new URL('./svg/solved-200.svg', import.meta.url), 'utf8');

describe('svg：形（contracts/api.md）', () => {
  test('揃った状態・既定の設定は保存した全文と同じ', () => {
    expect(svg()).toBe(SOLVED_200);
  });

  test('要素の順と属性', () => {
    const s = svg();
    expect(s).not.toContain('\n');
    expect(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">')).toBe(true);
    expect(s).not.toContain('<rect');
    expect(s).toContain('<g stroke="#000000" stroke-width="2" stroke-linejoin="miter" stroke-miterlimit="10">');
    expect(s).toContain('<g fill="none" stroke="#000000" stroke-width="4" stroke-linejoin="miter" stroke-miterlimit="10">');
    expect(s.match(/<polygon points="[^"]+" fill="#[0-9a-f]{6}"\/>/g)).toHaveLength(26);
    expect(s.match(/<polygon points="[^"]+"\/>/g)).toHaveLength(2);
    expect(s.match(/<path d="[^"]+"\/>/g)).toHaveLength(1);
    expect(s.endsWith('</g></svg>')).toBe(true);
  });

  test('数値：小数第 2 位まで、末尾の 0 は書かない', () => {
    const numbers = svg({ size: 123.456 }).match(/-?\d+(\.\d+)?/g)!;
    for (const n of numbers) {
      expect(n).not.toMatch(/\.\d{3,}/);
      expect(n).not.toMatch(/\.\d*0$/);
    }
  });

  test('同じ入力なら同じ文字列', () => {
    const opts = { case: "R U R' U' R' F R2 U' R' U' R U R' F'", size: 300 };
    expect(svg(opts)).toBe(svg(opts));
  });
});
