# Quickstart: 動くことを確かめる手順

実装ができたあとに、仕様を満たしていることを確かめる手順。中身の詳しい形は `contracts/api.md`・
`contracts/notation.md`・`data-model.md` を見る。

## 用意

- Node.js 20.19 以上（開発は 24）、npm
- 正解データを書き出し直すときだけ、サイトのリポジトリ（既定 `../MegaminxImageEditor`、`SITE_REPO` で変更）
- ブラウザのテストだけ、Playwright のブラウザ（`npx playwright install`）

```sh
npm install
npm run build        # dist/ に ES モジュールと型定義
```

## 1. 正解データとの一致（SC-002・SC-003、原則 I）

```sh
npm test
```

- `test/golden/cases.json`：410 件すべてで、`stickerColors({ case: alg })` と `stickerColors({ alg: setup })` が
  サイトの 26 色と一致する。OLL は `scheme: ollScheme()` でも一致する
- `test/golden/notation.json`：境目の手順すべてで、読める・読めない・エラーの種類と前半のメッセージがサイトと同じ。
  `canonicalAlg`・`simplifyAlg` の結果もサイトと同じ
- `test/golden/geometry.json`：大きさ 200 の 26 枚の多角形の点が、サイトと小数第 2 位まで一致する

正解データを書き出し直す（サイトが変わったとき）：

```sh
SITE_REPO=../MegaminxImageEditor npm run export:site
git diff test/golden src/cases   # 差があれば、原則 I に沿って理由を確かめる
```

## 2. 5 行で SVG（SC-001）

```js
// demo.mjs
import { writeFileSync } from 'node:fs';
import { svg } from 'megaminx-image';
writeFileSync('t-perm.svg', svg({ case: "R U R' U' R' F R2 U' R' U' R U R' F'" }));
```

- `node demo.mjs` で `t-perm.svg` ができ、ブラウザで開くと最後の層の画像（F 面が手前）が見える

## 2b. 別の向き（FR-033）

```js
import { svg, stickerColors } from 'megaminx-image';
import { PLL_CASES } from 'megaminx-image/cases';
const { alg, setup } = PLL_CASES[0];
svg({ case: alg, rotate: 1 });   // U を 1 回回した向きの A1+
// 確かめ：stickerColors({ alg: setup, rotate: 1 }) と stickerColors({ alg: setup + ' U' }) が同じ
```

## 3. エラー（原則 VI）

```js
import { svg } from 'megaminx-image';
svg({ alg: '(R U' });          // SyntaxError: Missing closing parenthesis (opened at position 0)
svg({ alg: 'R 2' });           // SyntaxError: Invalid move: "2" (at position 2)
svg({ scheme: { U: 'orange' } }); // TypeError: Unknown color: "orange"
```

## 4. 同じ入力なら同じ出力（SC-006、原則 IV）

```sh
npm run test:browser
```

- 決めた入力の一覧について、Chromium・Firefox・WebKit で作った SVG が、Node.js で作った SVG と 1 文字も違わない

## 5. 速さ（SC-004）

```sh
npm run test:perf
```

- 1,000 枚の平均が 10ms 未満（読み込み直後の 1 回を除く）

## 6. PNG（任意の依存）

```sh
npm install @resvg/resvg-js
node -e "import('megaminx-image/png').then(async m => require('fs').writeFileSync('a.png', await m.png({ case: 'R U' })))"
```

- `@resvg/resvg-js` を入れていなければ、入れ方を書いたエラーになる。`svg` などはふつうに動く

## 7. 必須の依存なし（SC-005、原則 II）

```sh
npm pack --dry-run
node -e "const p=require('./package.json'); if (Object.keys(p.dependencies||{}).length) process.exit(1)"
```

- `dependencies` が空。`@resvg/resvg-js` は任意の `peerDependencies` だけ

## 8. README の画像の例（SC-007、原則 VIII）

```sh
npm run build:readme-images
git diff --exit-code docs/images   # 作り直しても変わらない
```
