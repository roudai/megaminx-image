// README の画像の例を docs/images/ に書き出す。npm run build:readme-images（先に build する）
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { OLL_CASES, PLL_CASES } from '../dist/cases/index.js';
import { centroid, stickerPolygons } from '../dist/geometry.js';
import { ollScheme, svg } from '../dist/index.js';
import { readmeImages } from './readme-images.mjs';

const dir = fileURLToPath(new URL('../docs/images/', import.meta.url));
mkdirSync(dir, { recursive: true });
const images = readmeImages({ svg, ollScheme, PLL_CASES, OLL_CASES, stickerPolygons, centroid });
for (const [name, content] of Object.entries(images)) {
  writeFileSync(dir + name, content + '\n');
  console.log('wrote docs/images/' + name);
}
