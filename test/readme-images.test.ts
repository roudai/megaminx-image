// README の画像の例が、ライブラリで作り直したものと同じか（原則 VIII・SC-007）
import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
// @ts-expect-error 型定義の無い開発用のスクリプト
import { readmeImages } from '../scripts/readme-images.mjs';
import { OLL_CASES, PLL_CASES } from '../src/cases/index.js';
import { centroid, stickerPolygons } from '../src/geometry.js';
import { ollScheme, svg } from '../src/index.js';

const dir = new URL('../docs/images/', import.meta.url);
const images: Record<string, string> = readmeImages({ svg, ollScheme, PLL_CASES, OLL_CASES, stickerPolygons, centroid });

test('docs/images/ のファイルがちょうど作り直したものだけ', () => {
  expect(readdirSync(dir).sort()).toEqual(Object.keys(images).sort());
});

test.each(Object.keys(images))('%s が作り直したものと同じ', (name) => {
  expect(readFileSync(new URL(name, dir), 'utf8')).toBe(images[name] + '\n');
});
