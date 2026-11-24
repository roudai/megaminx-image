// 既存のサイト（MegaminxImageEditor）のコードを直接動かして、正解データとケースのデータを書き出す。
//   SITE_REPO=../MegaminxImageEditor node scripts/export-from-site.mjs
// 書き出すもの：
//   test/golden/cases.json     PLL・OLL の全ケースの 26 色（case・alg、OLL は OLL 用の配色も）
//   test/golden/notation.json  記法の境目の手順と、サイトでの結果
//   test/golden/geometry.json  大きさ 200 のときの 26 枚の多角形
//   src/cases/pll.ts・oll.ts   ケースのデータ（name・group・alg・setup）
// 正解データは手で直さない。サイトが変わったら書き出し直す（原則 I）。
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = resolve(ROOT, process.env.SITE_REPO ?? '../MegaminxImageEditor');
const require = createRequire(join(SITE, 'package.json'));

const M = require(join(SITE, 'js/megaminx-state.js'));
const PLL = require(join(SITE, 'js/pll-data.js'));
const OLL = require(join(SITE, 'js/oll-data.js'));
const commit = execFileSync('git', ['-C', SITE, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

// 状態 → 26 色（ucolor 11 → scolor 15）
const colors = (state, scheme) => {
  const c = M.toImageColors(state, scheme);
  return c.ucolor.concat(c.scolor);
};

// ---- ケース ----
const OLL_SCHEME = M.ollMask(M.DEFAULT_SCHEME);
function caseRecord(c, withOll) {
  const caseState = M.applyAlg(c.alg, { inverse: true, cancelRotation: true });
  const rec = {
    name: c.name,
    group: c.group,
    alg: c.alg,
    setup: c.setup,
    case: colors(caseState),
    apply: colors(M.applyAlg(c.setup)),
  };
  if (withOll) rec.ollCase = colors(caseState, OLL_SCHEME);
  return rec;
}
const cases = {
  site: { commit },
  pll: PLL.map((c) => caseRecord(c, false)),
  oll: OLL.map((c) => caseRecord(c, true)),
};

// ---- 記法の境目 ----
const NOTATION_INPUTS = [
  '', '   ', 'R', 'r', "R'", 'R2', "R2'", "R'2", 'R3', 'R5', 'R0', 'R10', "R2'3",
  'R 2', '2', 'Q', 'RQ', '(R U', 'R U)', ')', '()', '()2', "(R U R' U')2", "(R U)'",
  "((R U)2 R')'2", "(R U)2'", "(R U)'2", 'br bl dr dl dbr dbl', 'BR BL DR DL DBR DBL', 'Dfr DFL',
  "Y y' y2", 'R’ U‘ F′ B´', 'R` U', '（R U）2', 'R　U、F,L', 'R\tU\nF', "R R' U U", "R U U' R'",
  'R R R R R', "(R U) U'", "(R R')2 U", 'y y y y y', 'U F R L BR BL DR DL DBR DBL B D y',
];
const notation = {
  site: { commit },
  items: NOTATION_INPUTS.map((input) => {
    try {
      const state = M.applyAlg(input);
      return {
        input,
        ok: true,
        colors: colors(state),
        canonical: M.canonicalAlg(input),
        simplified: M.simplifyAlg(input).alg,
      };
    } catch (e) {
      return { input, ok: false, error: { name: e.name, message: e.message } };
    }
  }),
};

// ---- 形（megaminx-draw.js の stickers を取り出す）----
const drawSrc = readFileSync(join(SITE, 'js/megaminx-draw.js'), 'utf8');
const HOOK = 'window.MegaminxDraw = { draw: draw,';
if (drawSrc.split(HOOK).length !== 2) {
  throw new Error('js/megaminx-draw.js: "' + HOOK + '" がちょうど 1 か所ありません（サイトが変わった？）');
}
const sandbox = { window: {} };
vm.runInNewContext(drawSrc.replace(HOOK, 'window.MegaminxDraw = { stickers: stickers, geometry: geometry, draw: draw,'), sandbox);
const geometry = {
  site: { commit },
  size: 200,
  stickers: sandbox.window.MegaminxDraw.stickers(200).map((s) => {
    const out = {};
    if (s.u != null) out.u = s.u;
    if (s.s != null) out.s = s.s;
    out.points = s.points.map((p) => [p[0], p[1]]);
    return out;
  }),
};

// ---- 書き出し ----
const write = (rel, text) => {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  console.log('wrote', rel);
};
write('test/golden/cases.json', JSON.stringify(cases, null, 2) + '\n');
write('test/golden/notation.json', JSON.stringify(notation, null, 2) + '\n');
write('test/golden/geometry.json', JSON.stringify(geometry, null, 2) + '\n');

const caseModule = (constName, list, source) =>
  [
    '// 自動生成ファイル。手で編集しないこと。',
    `// 元データ: MegaminxImageEditor の ${source}（commit ${commit}）`,
    '// 生成: npm run export:site',
    "import type { CaseEntry } from './types.js';",
    '',
    `export const ${constName}: readonly CaseEntry[] = Object.freeze([`,
    ...list.map((c) => {
      const fields = ['name', 'group', 'alg', 'setup'].map((k) => `${k}: ${JSON.stringify(c[k])}`);
      return `  Object.freeze({ ${fields.join(', ')} }),`;
    }),
    ']);',
    '',
  ].join('\n');
write('src/cases/pll.ts', caseModule('PLL_CASES', PLL, 'js/pll-data.js'));
write('src/cases/oll.ts', caseModule('OLL_CASES', OLL, 'js/oll-data.js'));
console.log(`PLL ${PLL.length} / OLL ${OLL.length} (site ${commit.slice(0, 7)})`);
