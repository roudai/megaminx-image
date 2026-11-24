import { describe, expect, test } from 'vitest';
import { svg } from '../src/index.js';

describe('svg：見た目の指定', () => {
  test('size: 400 → 幅 400、細い線 4・太い線 8', () => {
    const s = svg({ size: 400 });
    expect(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">')).toBe(true);
    expect(s).toContain('<g stroke="#000000" stroke-width="4" ');
    expect(s).toContain('<g fill="none" stroke="#000000" stroke-width="8" ');
  });

  test('size: 123.456 → 数値は小数第 2 位まで', () => {
    const s = svg({ size: 123.456 });
    expect(s).toContain('width="123.46" height="123.46" viewBox="0 0 123.46 123.46"');
    expect(s).toContain('stroke-width="1.23"');
    expect(s).toContain('stroke-width="2.47"');
  });

  test('lineColor：色コードは 16 進に', () => {
    const s = svg({ lineColor: 'r' });
    expect(s).toContain('<g stroke="#ff0000" ');
    expect(s).toContain('<g fill="none" stroke="#ff0000" ');
  });

  test('background：<g> の前に全面の <rect>、16 進は小文字', () => {
    const s = svg({ background: '#ABCDEF' });
    expect(s).toContain('viewBox="0 0 200 200"><rect width="200" height="200" fill="#abcdef"/><g ');
  });

  test('ステッカーの色は 16 進（直接指定・上書き）', () => {
    const s = svg({ state: Array(26).fill('#ABCDEF'), stickers: { 0: 'r' } });
    expect(s.match(/fill="#abcdef"/g)).toHaveLength(25);
    expect(s.match(/fill="#ff0000"/g)).toHaveLength(1);
  });
});
