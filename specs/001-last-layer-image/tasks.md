---

description: "megaminx-image（最後の層の画像ライブラリ）のタスク"
---

# Tasks: メガミンクスの最後の層の画像ライブラリ（megaminx-image）

**Input**: `specs/001-last-layer-image/` の plan.md・spec.md・research.md・data-model.md・contracts/・quickstart.md

**Tests**: 原則 III（テストを先に）により必須。各フェーズのテストを先に書き、`npx vitest run <ファイル>` で
**失敗することを確かめてから**実装する。正解データ（原則 I）と記法の境目・エラー（原則 III・VI）のテストを必ず持つ。

**サイト**: 既存のサイトのリポジトリ。既定 `../MegaminxImageEditor`（環境変数 `SITE_REPO` で変える）。
写し元は `js/megaminx-state.js`（状態計算）・`js/megaminx-draw.js`（形）・`js/pll-data.js`・`js/oll-data.js`。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並べて進められる（別のファイルで、終わっていないタスクに依存しない）
- **[Story]**: 対応するユーザーストーリー（US1〜US4。spec.md）

---

## Phase 1: Setup（土台）

**Purpose**: パッケージとテストの道具を用意する

- [ ] T001 `package.json` を作る：`name: "megaminx-image"`・`version: "1.0.0"`・`type: "module"`・`license: "MIT"`・
  `engines.node: ">=20.19"`・`sideEffects: false`・`files: ["dist", "LICENSE", "README.md"]`・
  `exports` に `"."`・`"./canvas"`・`"./png"`・`"./cases"`（それぞれ `types` と `default` を `dist/` の `.d.ts`・`.js` に）。
  `dependencies` は書かない。`peerDependencies` に `@resvg/resvg-js` を書き（範囲は `npm view @resvg/resvg-js version` で最新の版を見て決める）、
  `peerDependenciesMeta` で任意にする。
  `devDependencies`：`typescript`・`vitest`・`@playwright/test`・`@resvg/resvg-js`。
  `scripts`：`build`（`tsc -p tsconfig.build.json`）・`test`（`vitest run --exclude test/perf.test.ts`）・
  `test:perf`（`vitest run test/perf.test.ts`）・`test:browser`（`npm run build && playwright test -c test/browser`）・
  `export:site`（`node scripts/export-from-site.mjs`）・`build:geometry`（`node scripts/build-geometry-table.mjs`）・
  `build:readme-images`（`npm run build && node scripts/build-readme-images.mjs`）。`npm install` を実行する
- [ ] T002 [P] `LICENSE`（MIT、著作者 roudai、2026）と `.gitignore`（`node_modules/`・`dist/`・`test-results/`・
  `playwright-report/`）を作る
- [ ] T003 [P] `tsconfig.json`（`strict`・`target: ES2020`・`module`/`moduleResolution: NodeNext`・`noEmit`、
  `src`・`test`・`scripts` を含む）と `tsconfig.build.json`（`src` だけ、`outDir: dist`・`declaration: true`・
  `noEmit: false`）を作る
- [ ] T004 [P] `vitest.config.ts`（`test/**/*.test.ts`、環境は node）と `test/browser/playwright.config.ts`
  （Chromium・Firefox・WebKit の 3 つ）を作る。`vitest.config.ts` には `passWithNoTests: true` を付ける
  （中身ができるまで CI が失敗しないように）
- [ ] T005 [P] `.github/workflows/ci.yml` を作る（原則の「開発の流れと品質ゲート」）。プルリクエストと main への push で動かす。
  Node.js 20.x と 24.x の両方で：`npm ci` → `npm run build` → `npm test`
  → `dependencies` が空かの確認（`node -e "process.exit(Object.keys(require('./package.json').dependencies||{}).length)"`）
  → `npx playwright install --with-deps` → `npm run test:browser`
  → `npm run build:readme-images && git diff --exit-code docs/images`。
  速さのテスト（`test:perf`）は、CI の機械によって結果がぶれるので入れない。
  あわせて `.github/pull_request_template.md` に原則の確認欄を作る（「公開の API・SVG の形・並び順を変えたか →
  変えたならメジャー版を上げたか」「サイトと違う結果にしたか → 原則の変更として記録したか」）

---

## Phase 2: Foundational（すべてのストーリーの前提）

**Purpose**: サイトの正解データ・記法の読み方・状態計算・色。ここが終わるまでストーリーに進まない

### 正解データの書き出し（research.md R4）

- [ ] T006 `scripts/export-from-site.mjs` を作る。`SITE_REPO`（既定 `../MegaminxImageEditor`）から
  `createRequire` で `js/megaminx-state.js`・`js/pll-data.js`・`js/oll-data.js` を読み、
  `js/megaminx-draw.js` はソースを文字列で読み、`window.MegaminxDraw = { draw: draw,` を
  `window.MegaminxDraw = { stickers: stickers, geometry: geometry, draw: draw,` に置き換えてから
  `vm.runInNewContext(src, { window: {} })` で実行し、`stickers(200)` を得る。置き換える文字列がちょうど 1 か所
  なければエラーで止める（サイトが変わったことに気づけるように）。次を書き出す（JSON は 2 字下げ、キーの順を固定）：
  - `test/golden/cases.json`：`{ site: { commit }, pll: [...], oll: [...] }`。各件
    `{ name, group, alg, setup, case: [26 色], apply: [26 色], ollCase?: [26 色] }`。
    `case` は `toImageColors(applyAlg(alg, { inverse: true, cancelRotation: true }))`、`apply` は
    `toImageColors(applyAlg(setup))`、OLL の `ollCase` は `ollMask(DEFAULT_SCHEME)` で求めた case の色。
    26 色は `ucolor`（11）→ `scolor`（15）の順につなぐ
  - `test/golden/notation.json`：スクリプトの中の入力の一覧（下記）それぞれについて
    `{ input, ok: true, colors: [26], canonical, simplified }` か `{ input, ok: false, error: { name, message } }`。
    一覧：`""`・`"   "`・`"R"`・`"r"`・`"R'"`・`"R2"`・`"R2'"`・`"R'2"`・`"R3"`・`"R5"`・`"R0"`・`"R10"`・`"R2'3"`・
    `"R 2"`・`"2"`・`"Q"`・`"RQ"`・`"(R U"`・`"R U)"`・`")"`・`"()"`・`"()2"`・`"(R U R' U')2"`・`"(R U)'"`・
    `"((R U)2 R')'2"`・`"(R U)2'"`・`"(R U)'2"`・`"br bl dr dl dbr dbl"`・`"BR BL DR DL DBR DBL"`・`"Dfr DFL"`・
    `"Y y' y2"`・`"R’ U‘ F′ B´"`・バッククォートを使った `R` ＋ U+0060 ＋ ` U`・`"（R U）2"`・`"R　U、F,L"`・`"R\tU\nF"`・`"R R' U U"`・`"R U U' R'"`・
    `"R R R R R"`・`"(R U) U'"`・`"(R R')2 U"`・`"y y y y y"`・`"U F R L BR BL DR DL DBR DBL B D y"`。
    `canonical` は `canonicalAlg(input)`、`simplified` は `simplifyAlg(input).alg`
  - `test/golden/geometry.json`：大きさ 200 のときの 26 枚の多角形（サイトの描く順、`{ u?: 番号, s?: 番号, points }`）
  - `src/cases/pll.ts`・`src/cases/oll.ts`：`// 自動生成` の注意書きと、
    `export const PLL_CASES = Object.freeze([...])`（各件 `Object.freeze({ name, group, alg, setup })`）。
    型は `src/cases/types.ts` の `CaseEntry`（T007 で作る）
  - サイトのコミットは `git -C $SITE_REPO rev-parse HEAD` で得る
- [ ] T007 `src/cases/types.ts` に `CaseEntry`（`readonly name/group/alg/setup: string`）を書き、
  `npm run export:site` を実行して `test/golden/*.json`・`src/cases/pll.ts`・`src/cases/oll.ts` を作る。
  件数が PLL 151・OLL 259 であることを確かめる

### テスト（先に書いて失敗を確かめる）

- [ ] T008 [P] `test/notation.test.ts`：内部の `parseAlg`（`src/notation.ts`）のテスト
  - `contracts/notation.md` の置き換え・文法・回数（5 で割った余り、`'` で負）・括弧の回数と逆・入れ子・空の括弧
  - `test/golden/notation.json` の各件：`ok` が同じ。読めないものはエラーの型（`SyntaxError`）が同じで、
    メッセージがサイトのメッセージで始まる
  - 位置：`"R U Q"` → `(at position 4)`、`"R　　Q"`（全角の空白 2 つ）→ 元の文字列の位置 `(at position 3)`、
    `"(R U"` → `(opened at position 0)`、`"R U)"` → `(at position 3)`
- [ ] T009 [P] `test/state.test.ts`：内部の `src/state.ts` のテスト
  - 132 枚、面ごとに 11 枚。各面の回転と `y` は 5 回で元に戻る
  - 固定のシードのランダムな手順（サイトの `test/megaminx-state.test.js` と同じ乱数）で、手順を回してから
    逆を回すと揃った状態に戻る
  - `test/golden/notation.json` の読める件で、揃った状態から回した 26 色（既定の配色）が `colors` と同じ
- [ ] T010 [P] `test/colors.test.ts`：`COLOR_CODES`（15 個、`data-model.md` の表と同じ 16 進）、色の検証
  （`'o'`・`'#FFA500'` は通り、`'orange'`・`'#fff'`・`'O'`・`''`・`null` は `TypeError: Unknown color: "…"`）、
  `DEFAULT_SCHEME` の 12 面

### 実装

- [ ] T011 `src/notation.ts`：サイトの `normalize`・`readAmount`・`parseAlg`・`invertMoves`・`canonicalFace` を写す。
  置き換えで縮んだ空白の位置を元の文字列に戻す対応表を持ち、エラーのメッセージに位置を足す
  （`contracts/api.md` のエラーの表）。`Move = { face, turns }` を内部の型として export（入口からは出さない）
- [ ] T012 `src/state.ts`：サイトの幾何（法線・132 枚の位置・`makeMove`・`MOVES`）・`solved`・`applyMoves`・
  `applyAlg(alg, { inverse, cancelRotation, state })`・`netRotation`・`topView`・`toImageColors` の並べ方を写す。
  `toImageColors` は 26 個の面の名前の配列（`ucolor` 11 → `scolor` 15 の順）を返す `topFaces(state)` にする
- [ ] T013 `src/colors.ts`：`COLOR_CODES`（凍結）・`isColor`・`normalizeColor`（16 進は小文字に）・
  `assertColor(value, label)`・`DEFAULT_SCHEME`（凍結）・`resolveScheme(scheme)`（知らない面は
  `TypeError: Unknown face: "…"`、色の検証）・`toHex(color)`
- [ ] T014 T008〜T010 がすべて通ることを確かめる（`npx vitest run test/notation.test.ts test/state.test.ts test/colors.test.ts`）

**Checkpoint**: サイトと同じに読み・回せる。ストーリーに進める

---

## Phase 3: User Story 1 - 手順の文字列からケースの画像（SVG）を作る (Priority: P1) 🎯 MVP

**Goal**: `svg({ alg })`・`svg({ case })`・`stickerColors(...)` で、サイトと同じ 26 色の SVG を作る。ケースのデータも引ける

**Independent Test**: 410 件 × case・alg の 26 色がサイトと一致し、SVG の文字列が契約の形で、何度作っても同じ

### Tests for User Story 1（先に書いて失敗を確かめる）⚠️

- [ ] T015 [P] [US1] `test/stickers.test.ts`：`stickerColors()` が揃った状態（番号 15〜17 が `a`）。
  `test/golden/cases.json` の 410 件すべてで `stickerColors({ case: alg })` が `case`、
  `stickerColors({ alg: setup })` が `apply` と同じ。`{ start: "R U", alg: "U' R'" }` と `{ start: "R", case: "R" }` が揃った状態の色になる
  （`start` の状態から計算する）。持ち替えの打ち消しは case だけ（`{ alg: 'y' }` は揃った状態と違い、`{ case: 'y' }` は同じ）
- [ ] T016 [P] [US1] `test/geometry.test.ts`：大きさ 1 の表が計算式（`Math.cos`・`Math.sin`）と 1e-12 まで合う。
  大きさ 200 の 26 枚の多角形が `test/golden/geometry.json` と小数第 2 位で一致し、描く順が同じ。
  細い線 2・太い線 4（大きさ 200）、`round` が `Math.round(v * 100) / 100`
- [ ] T017 [P] [US1] `test/svg.test.ts`：揃った状態・既定の設定の SVG が `contracts/api.md` の形
  （`<svg …>` → 線の `<g>` に 26 個の `<polygon>` → 太い線の `<g>` に 2 つの `<polygon>` と `<path>`、改行なし）。
  色は小文字の 16 進。数値に末尾の 0 が無い。同じ入力で 2 回作ると同じ文字列。背景が無いとき `<rect>` が無い。
  SVG の全文を `test/svg/solved-200.svg` に保存して比べる（初回は中身を目で確かめてから保存する）
- [ ] T018 [P] [US1] `test/cases.test.ts`：`PLL_CASES` 151 件・`OLL_CASES` 259 件、名前が種類の中で重ならない、
  各件が `name`・`group`・`alg`・`setup` の文字列だけを持ち凍結されている、`test/golden/cases.json` と同じ並び・同じ中身

### Implementation for User Story 1

- [ ] T019 [US1] `scripts/build-geometry-table.mjs`：サイトの `geometry` の式（大きさ 1、`origin = 0.5`）で、
  中心・U 面の外周・側面の外周の五角形の頂点 5 つずつと、辺の点（`in`・`out` × 辺 0〜4 × `l` 0・1）を
  17 桁で求め、`src/geometry-table.ts`（`// 自動生成` と凍結した数値の表）に書く。`npm run build:geometry` で作る
- [ ] T020 [US1] `src/geometry.ts`：表と大きさから、サイトの `stickers` と同じ 26 枚の多角形（描く順・`u`/`s` の番号）、
  太い線（U 面の外周・側面の外周・区切り 5 本）、線の太さ（`size / 100`・`size / 50`）を返す。数値は `round`
- [ ] T021 [US1] `src/stickers.ts`：`resolveState(options)`（`alg`／`case`／なし、`start`、既定の配色）→ 26 個の色。
  `case` は `applyAlg(case, { inverse: true, cancelRotation: true, state: start の状態 })`、
  `alg` は `applyAlg(alg, { state })`。`stickerColors(options)` として公開する形にする
- [ ] T022 [US1] `src/svg.ts`：`svg(options)`。`contracts/api.md` の形・属性の順で文字列を組み立てる
  （`size` 既定 200、`lineColor` 既定 `#000000`、`background` 既定 `null`）
- [ ] T023 [US1] `src/cases/index.ts`（`PLL_CASES`・`OLL_CASES`・`type CaseEntry` を export）と `src/index.ts`
  （`svg`・`stickerColors`・`DEFAULT_SCHEME`・`COLOR_CODES` と型 `Face`・`ColorCode`・`Color`・`Scheme`・
  `StateOptions`・`ImageOptions`）を作る。内部の関数は export しない
- [ ] T024 [US1] T015〜T018 が通ることを確かめ、`npm run build` のあと `quickstart.md` の 2 の手順で
  `t-perm.svg` ができ、ブラウザで開いて F 面が手前に見えることを確かめる

**Checkpoint**: MVP。手順から SVG を作れ、サイトと同じ色になる

---

## Phase 4: User Story 2 - 間違いをエラーで知る・手順の道具 (Priority: P1)

**Goal**: 手順・設定の間違いがどこが悪いか分かるエラーになり、`canonicalAlg`・`invertAlg`・`simplifyAlg` が使える

**Independent Test**: `contracts/api.md` のエラーの表のすべての行が、その型・メッセージになる。道具がサイトと同じ結果を返す

### Tests for User Story 2（先に書いて失敗を確かめる）⚠️

- [ ] T025 [P] [US2] `test/notation-tools.test.ts`：
  - `canonicalAlg`：`test/golden/notation.json` の読める件で `canonical` と同じ。`r u bR' Y` → `R U BR' y`。
    読めない件は `SyntaxError`
  - `simplifyAlg`：読める件で `simplified` と同じ。`R R' U U` → `U2`。読めない件は `SyntaxError`
  - `invertAlg`：`R U (R' F)2 BR'` → `BR (F' R)2 U' R'`、`R3` → `R2`、`R5 U` → `U'`、`(R U)2'` → `(U' R')2'`、
    `()` → `""`。固定のシードのランダムな手順（括弧・回数・`'` を含む）で、`alg` を回してから `invertAlg(alg)` を
    回すと揃った状態に戻る。読めない手順は `SyntaxError`
- [ ] T026 [P] [US2] `test/options.test.ts`：`contracts/api.md` のエラーの表の各行（`svg` と `stickerColors` の両方）。
  `alg`・`case`・`state` を 2 つ以上、`start` と `state`、知らない設定 `algorithm`、`size` が `0`・`-1`・`NaN`・
  `Infinity`・`'200'`、`lineColor: 'black'`、`background: 'none'`、`scheme: { FR: 'o' }`、
  `scheme: { U: 'orange' }`、`alg` が文字列でない（`TypeError`）

### Implementation for User Story 2

- [ ] T027 [US2] `src/notation.ts` に `canonicalAlg`（読めなければ `SyntaxError`、読めればサイトと同じ置き換え）・
  `simplifyAlg`（サイトの `simplifyAlg` を写し、`alg` の文字列だけ返す）・`invertAlg`（`contracts/notation.md` の決まり。
  括弧の構造を保つため、読んだ木の形を作る内部の関数を足す）を足す
- [ ] T028 [US2] `src/stickers.ts`・`src/svg.ts` に設定の検証を足す：知らない設定の名前、作り方の数、`start` と `state`、
  手順が文字列か、`size`・`lineColor`・`background` の検証。メッセージは `contracts/api.md` のとおり
- [ ] T029 [US2] `src/index.ts` から `canonicalAlg`・`invertAlg`・`simplifyAlg` を export し、T025・T026 が通ることを確かめる

**Checkpoint**: US1 と US2 が通る

---

## Phase 5: User Story 3 - 色・配色・見た目・向きを指定する (Priority: P2)

**Goal**: `scheme`・`ollScheme`・`state`・`stickers`（上書き）・`rotate`・`size`・`lineColor`・`background`

**Independent Test**: OLL の 259 件が OLL 用の配色でサイトと一致し、直接指定・上書き・向き・見た目が出力に反映される

### Tests for User Story 3（先に書いて失敗を確かめる）⚠️

- [ ] T030 [P] [US3] `test/stickers-options.test.ts`：
  - `ollScheme()` が U `u`・ほか 11 面 `d`。`ollScheme({ U: 'y' })` の U が `y`。OLL の 259 件で
    `stickerColors({ case: alg, scheme: ollScheme() })` が `ollCase` と同じ
  - `scheme` は置き換え：`{ case: 'R', scheme: { U: 'u' } }` は `TypeError: No color set for face: …`
  - `state`：26 色をそのまま返す（16 進は小文字に）。25 色・27 色は `RangeError`
  - `stickers`：番号の色だけ変わる。`26`・`-1`・`1.5`・`'a'` は `RangeError`
  - `rotate`：0〜4 と `-1`・`5`・`7`。固定のシードのランダムな手順と 410 件の `setup` で、
    `{ alg: A, rotate: k }` が `{ alg: A + ' U'.repeat(k mod 5) }` と同じ。`case`・`state` は向き 0 の結果を
    `data-model.md` の式で付け替えたものと同じ。`{ rotate: 1, stickers: { 1: 'r' } }` は回したあとの番号 1 が `r`。
    `0.5`・`NaN`・`'1'` は `RangeError: "rotate" must be an integer (got …)`
- [ ] T031 [P] [US3] `test/svg-appearance.test.ts`：`size: 400` で `width="400"`・細い線 `4`・太い線 `8`、
  `size: 123.456` の数値が小数第 2 位まで、`lineColor: 'r'` で `stroke="#ff0000"`、`background: '#ABCDEF'` で
  `<rect … fill="#abcdef"/>` が `<g>` の前にある

### Implementation for User Story 3

- [ ] T032 [US3] `src/colors.ts` に `ollScheme(scheme?)` を足し、`src/index.ts` から export する
- [ ] T033 [US3] `src/stickers.ts` に `state`（26 色の検証）・`rotate`（`data-model.md` の付け替え）・`stickers`（上書き）を足す。
  順は「作り方 → 向き → 上書き」
- [ ] T034 [US3] `src/svg.ts` の見た目の指定を T031 に合わせて仕上げ、T030・T031 が通ることを確かめる

**Checkpoint**: US1〜US3 が通る

---

## Phase 6: User Story 4 - PNG・canvas・色の並び (Priority: P3)

**Goal**: `megaminx-image/canvas` の `drawCanvas` と `megaminx-image/png` の `png`。色の並びは US1 の `stickerColors`

**Independent Test**: canvas に SVG と同じ点・順・太さで描き、PNG が正しい大きさのバイト列になる。依存が無ければ案内のエラー

### Tests for User Story 4（先に書いて失敗を確かめる）⚠️

- [ ] T035 [P] [US4] `test/canvas.test.ts`：呼び出しを記録する偽物の canvas（`width`・`height`・`getContext('2d')` が
  記録する context を返す）で、幅・高さが `size`、`lineJoin` が `miter`・`miterLimit` が 10、`fillStyle` が 16 進、
  26 枚の `moveTo`/`lineTo` の点が `src/geometry.ts` と同じ順・同じ値、太い線の太さ。背景があれば `fillRect`。
  `globalThis.document` を消した状態でも動く
- [ ] T036 [P] [US4] `test/png.test.ts`：`png({ case: "R U R' U'", size: 300 })` が PNG の先頭 8 バイト
  （`89 50 4E 47 0D 0A 1A 0A`）で始まり、IHDR の幅・高さが 300。バイト列が `new Resvg(svg(options)).render().asPng()` と同じで、
  `render().pixels` で読んだ 26 枚の真ん中（多角形の頂点の平均）の画素が `stickerColors` の色と一致する。`@resvg/resvg-js` の読み込みが失敗するように
  `vi.mock` したとき、`Error: Install "@resvg/resvg-js" to export PNG (npm install @resvg/resvg-js)`

### Implementation for User Story 4

- [ ] T037 [P] [US4] `src/canvas.ts`：`drawCanvas(canvas, options)`。`src/geometry.ts` と `src/stickers.ts` を使い、
  サイトの `draw` と同じ順で描く（背景 → 26 枚を塗って細い線 → 太い線）。`getContext('2d')` だけを使う
- [ ] T038 [P] [US4] `src/png.ts`：`png(options)`。`svg(options)` を作り、`await import('@resvg/resvg-js')` で
  `new Resvg(svg).render().asPng()` を `Uint8Array` にして返す。読み込みに失敗したら案内のエラー
- [ ] T039 [US4] T035・T036 が通ることを確かめる。`npm run build` のあと、`dist/index.js` が `cases`・`png`・`canvas`・
  `@resvg` を読み込んでいないことを確かめる（`grep`）

**Checkpoint**: すべてのストーリーが通る

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T040 [P] `test/browser/svg-consistency.spec.ts`：Node.js で決めた入力の一覧（揃った状態、410 件から 20 件の
  case、`rotate`・`background`・`size: 123.456` を含む 10 件）の SVG を作り、ブラウザ 3 種で `dist/index.js` を読んで
  同じ入力の SVG を作り、1 文字も違わないことを確かめる（SC-006）。
  あわせて、決めた入力のうち 5 件で、`drawCanvas` で描いた canvas と、SVG を画像として別の canvas に描いたものの
  両方から、26 枚それぞれの真ん中（多角形の頂点の平均。`src/geometry.ts` の内部の関数）の画素を読み、
  `stickerColors` の色と各成分 ±2 以内で一致することを確かめる（spec US4 の 3）。
  `dist/` は `test/browser/playwright.config.ts` の `webServer` で、リポジトリを配る小さなサーバーを立てて読む。`npm run test:browser` で通す
- [ ] T041 [P] `test/perf.test.ts`：読み込み直後の 1 回を除き、410 件の case を順に 1,000 枚作った平均が 10ms 未満（SC-004）。
  `npm run test:perf` で通す
- [ ] T042 `scripts/build-readme-images.mjs`：`dist/` を使い、`docs/images/` に README の例の SVG を作る
  （揃った状態、`alg` の例、`case` の例、PLL の例とその `rotate: 1`、OLL 用の配色の例、`background` と
  `lineColor` の例、番号を書き込んだステッカーの並び順の図）。`test/readme-images.test.ts` で、作り直した結果が
  `docs/images/` のファイルと同じことを確かめる
- [ ] T043 `README.md`（英語）：インストール、5 行の例、記法（`contracts/notation.md`）、作り方 3 種（alg・case・state）と
  `start`・`stickers`・`rotate`、配色（色コードの表・`DEFAULT_SCHEME`・`ollScheme`）、出力（SVG・canvas・PNG・
  `stickerColors`）、ステッカーの並び順（図と表）、ケースのデータ（`megaminx-image/cases`）、手順の道具、エラー、数値の丸め方（小数第 2 位）、
  ライセンス。画像は `docs/images/` を参照する（SC-007、原則 VIII）
- [ ] T044 パッケージを確かめる：`dependencies` が無い、`npm pack --dry-run` の中身が `dist`・`LICENSE`・
  `README.md`・`package.json` だけ、CommonJS から `node -e "require('megaminx-image')"`（`npm link` か
  `npm pack` した物を別のフォルダで入れる）が動き、4 つの入口の型が解決できる
- [ ] T045 `quickstart.md` の 1〜8 をすべて実行して結果を確かめ、spec.md の Status を `Implemented` にする

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**：すぐ始められる
- **Foundational (Phase 2)**：Setup のあと。すべてのストーリーの前提
- **US1 (Phase 3)**：Foundational のあと。MVP
- **US2 (Phase 4)**：Foundational のあと。T028・T029 は `src/stickers.ts`・`src/svg.ts`・`src/index.ts` を触るので US1 のあと
- **US3 (Phase 5)**：US1 のあと（`src/stickers.ts`・`src/svg.ts` に足す）
- **US4 (Phase 6)**：US1 のあと（`src/geometry.ts`・`src/svg.ts` を使う）。US2・US3 とは別のファイル
- **Polish (Phase 7)**：すべてのストーリーのあと

### Within Each Phase

- テストを書く → 失敗を確かめる → 実装 → 通ることを確かめる（原則 III）
- 生成スクリプト（T006・T019）→ 生成物 → それを使う実装

### Parallel Opportunities

- Setup：T002・T003・T004・T005
- Foundational のテスト：T008・T009・T010
- US1 のテスト：T015・T016・T017・T018
- US2 のテスト：T025・T026
- US3 のテスト：T030・T031
- US4：テスト T035・T036、実装 T037・T038
- Polish：T040・T041
- US1 が終われば、US2 の道具（T025・T027）と US4（T035〜T038）は並べて進められる

---

## Parallel Example: User Story 1

```bash
# テストを並べて書く：
Task: "test/stickers.test.ts（410 件の一致）"
Task: "test/geometry.test.ts（サイトの形との一致）"
Task: "test/svg.test.ts（SVG の形と同じ出力）"
Task: "test/cases.test.ts（ケースのデータ）"
```

---

## Implementation Strategy

### MVP First（US1 だけ）

1. Phase 1・2 を終える（正解データの書き出しを含む）
2. Phase 3（US1）を終える
3. **止めて確かめる**：410 件の一致・SVG の形・`quickstart.md` の 2
4. ここで中身を見て、残りを進めるか決める

### Incremental Delivery

1. Setup ＋ Foundational → サイトと同じに読み・回せる
2. US1 → 手順から SVG（MVP）
3. US2 → エラーと手順の道具
4. US3 → 配色・見た目・向き
5. US4 → canvas・PNG
6. Polish → ブラウザでの一致・速さ・README・パッケージ → 1.0.0 を公開できる状態

---

## Notes

- [P] は別のファイルで、終わっていないタスクに依存しないもの
- サイトのコードを写すところ（T011・T012・T020・T027 の `simplifyAlg`・T037）は、サイトのコードと並べて読み、
  違いを入れない。違えるなら plan.md の「サイトとの違い」に書いてから（原則 I）
- 正解データ（`test/golden/`）は手で直さない。サイトが変わったら `npm run export:site` で書き出し直す
- タスクか、まとまった区切りごとにコミットする（メッセージは日本語）
