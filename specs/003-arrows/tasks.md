---

description: "arrows オプション（ステッカーからステッカーへの矢印）のタスク"
---

# Tasks: ステッカーからステッカーへの矢印（arrows）

**Input**: `specs/003-arrows/` の plan.md・spec.md・research.md・data-model.md・contracts/api.md・quickstart.md

**Tests**: 原則 III（テストを先に）により必須。テストを先に書き、`npx vitest run test/arrows.test.ts` で
**失敗することを確かめてから**実装する。`arrows` を省いたときの出力が変わらないことは、1.1.0 からのテスト
（410 ケースのサイトとの一致・`test/svg/` の正解ファイル）がそのまま通ることで確かめる。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並べて進められる（別のファイルで、終わっていないタスクに依存しない）
- **[Story]**: 対応するユーザーストーリー（US1〜US5。spec.md）

---

## Phase 1: Foundational（下準備）

**Purpose**: 型とオプションの名前を足す（ふるまいはまだ変えない）

- [X] T001 `src/types.ts` の `ImageOptions` に `arrows?: readonly (readonly [number, number])[]` と `arrowColor?: Color` を、
  説明のコメント付きで足す（contracts/api.md）。`src/options.ts` の `IMAGE_KEYS` に `'arrows'`・`'arrowColor'` を足す
  （`STATE_KEYS` には足さない）。`npm test`・`npm run typecheck` が通ることを確かめる

**Checkpoint**: 1.1.0 のテストがすべて通る（`arrows` を渡しても、まだ何も描かない）

---

## Phase 2: User Story 1 - ステッカーの間に矢印を描く（Priority: P1）🎯 MVP

**Goal**: `arrows` の矢印を、白い縁取り付きで、ステッカーと線の上に描く。SVG・canvas・PNG のすべて

**Independent Test**: H1+ の 5 本の矢印の SVG がスナップショットと同じ。`arrows` を省くと 1.1.0 と同じ

### Tests for User Story 1

- [X] T002 [US1] `test/arrows.test.ts` を作り、次を書く（この時点では失敗することを確かめる）
  - 省いたとき・`[]` のとき：`svg(opts)` が `arrows` なしと同じ文字列（`test/svg/solved-200.svg` とも比べる）。`drawCanvas` の呼び出しも同じ
  - H1+ の `case` ＋ `[[18, 15], [15, 12], [12, 24], [24, 21], [21, 18]]`：`svg()` の結果をファイルのスナップショット（`toMatchSnapshot`）。
    矢印の部分が太い線の `</g>` の後、`</svg>` の前にあり、contracts/api.md の 2 つの `<g>` の形になっている
  - 1 本の矢印の形（data-model.md の式から手で計算した値と比べる）：線の端が中心から 7 離れ、矢じりの先が `e`、長さ 12・幅 11
  - 大きさ 100 では、寸法と座標がほぼ半分（丸めの差 0.01 以内）
  - SC-002：H1+ の `case` の図の 26 色から計算した「今その位置にあるエッジが、揃えると行く位置」の組が、上の 5 本と一致する
  - 全経路：`drawCanvas` は SVG と同じ点・同じ順・同じ太さで描く（記録する偽の canvas）。`png` のバイト列は、同じ SVG を resvg で描いたものと同じ

### Implementation for User Story 1

- [X] T003 [US1] `src/arrows.ts` を作る：寸法の定数、`checkArrows`（この段階では形の確かめは最小限）、`arrowShapes(size, list)`
  （data-model.md「形」。中心は `stickerPolygons(size)` の頂点の平均、長さは `Math.sqrt`、座標は `round`）
- [X] T004 [US1] `src/svg.ts` に、太い線の後で縁取りの `<g>` と矢印の `<g>` を書き足す（contracts/api.md「SVG の形」）。
  `arrows` が無いか、まとめた結果が空なら何も書かない。`arrowColor` は `toHex(normalizeColor(...))`、既定 `#000000`
- [X] T005 [US1] `src/canvas.ts` に、同じ形を同じ順（縁取り → 矢印）で描く処理を足す。T002 が通ることを確かめる

**Checkpoint**: US1 のテストと、1.1.0 からのテストがすべて通る

---

## Phase 3: User Story 2 - 行きと帰りを 1 本の両矢印にまとめる（Priority: P1）

**Goal**: `[a, b]` と `[b, a]` を両矢印 1 本に、同じ矢印の重なりを 1 本にまとめる。短い矢印では矢じりを縮める

**Independent Test**: `[[12, 15], [15, 12]]` の SVG に、線が 1 本・矢じりが 2 つだけ

### Tests for User Story 2

- [X] T006 [US2] `test/arrows.test.ts` に次を足し、失敗することを確かめる
  - `[[12, 15], [15, 12]]`：線 1 本・矢じり 2 つ。線の両端は矢じりの底
  - `[[12, 15], [12, 15]]`：`[[12, 15]]` と同じ SVG
  - `[[12, 15], [18, 21], [15, 12]]`：2 本で、1 本目が両矢印（描く順は先に出た方の位置）
  - 隣り合う 2 枚（`[[2, 12], [12, 2]]`、中心の間 25.2）：矢じりが縮み、2 つの矢じりの底が重ならない（線の長さが 0 以上）
  - 片矢印の短い矢印（`[[2, 12]]`）：矢じりの長さが `avail` 以下

### Implementation for User Story 2

- [X] T007 [US2] `src/arrows.ts` の `checkArrows` にまとめ（research.md R5）を、`arrowShapes` に両矢印と矢じりの縮め（R3）を足す。T006 が通ることを確かめる

**Checkpoint**: 両矢印・重なり・短い矢印のテストが通る

---

## Phase 4: User Story 3 - 向き・show と組み合わせる（Priority: P2）

**Goal**: 番号は回した後の図の上の位置。`stickerColors` では受け付けない

### Tests for User Story 3

- [X] T008 [US3] `test/arrows.test.ts` に次を足す（T004 の実装で通るはずのものは、順を固定するテストとして足す）
  - `rotate: 0` と `rotate: 2` で同じ `arrows`：SVG の矢印の部分（太い線の `</g>` より後）が同じ文字列
  - `show` ＋ `arrows`：ステッカーの部分は `show` だけのときと同じ、矢印の部分は `arrows` だけのときと同じ
  - `stickerColors({ arrows: [[1, 2]] })`・`stickerColors({ arrowColor: 'r' })` → `TypeError: Unknown option: "arrows"` など

**Checkpoint**: 組み合わせのテストが通る

---

## Phase 5: User Story 5 - 誤った指定をエラーにする（Priority: P2）

**Goal**: 誤った `arrows` を 4 種のエラーにする（原則 VI）

### Tests for User Story 5

- [X] T009 [US5] `test/arrows.test.ts` に次を足し、失敗することを確かめる
  - 配列でない `18`・`'a'`・`{}`・`null` → `TypeError: "arrows" must be an array of [from, to] pairs (got …)`
  - 要素が `18`・`[1]`・`[1, 2, 3]`・`['1', 2]`・`null` → `TypeError: Each arrow must be [from, to] (got …)`
  - 番号が `26`・`-1`・`1.5`・`NaN` → `RangeError: Sticker index out of range: … (expected 0-25)`
  - `[5, 5]` → `RangeError: An arrow must connect two different stickers (got [5,5])`
  - `arrowColor: 'orange'` → `TypeError: Unknown color: "orange"`
  - `svg`・`drawCanvas`・`png` で同じエラー

### Implementation for User Story 5

- [X] T010 [US5] `src/arrows.ts` の `checkArrows` に確かめ（data-model.md「検証」）を足す。T009 が通ることを確かめる

**Checkpoint**: エラーのテストが通る

---

## Phase 6: User Story 4 - 色を変える（Priority: P3）

- [X] T011 [US4] `test/arrows.test.ts` に、`arrowColor: 'r'` で矢印の `<g>` が `#ff0000`・縁取りが `#ffffff`、省くと `#000000`、
  `#12AB34` は小文字の `#12ab34` になることを足す（T004 の実装で通るはず。通らなければ直す）

---

## Phase 7: Polish（ブラウザー・文書・版・最後の確認）

- [X] T012 [P] `test/browser/svg-consistency.spec.ts` の `INPUTS` に、矢印のある入力を足す（H1+ の 5 本、両矢印、`size: 123.456`、`rotate`・`show` と一緒、`arrowColor`）
- [X] T013 [P] `scripts/readme-images.mjs` に `arrows.svg`（H1+）・`arrows-swap.svg`（Z1 の 2 組の両矢印）を足す（research.md R7）。
  `npm run build:readme-images` で作り、ほかの図が変わらないことを `git diff docs/images` で確かめる。作った図を目で確かめる
- [X] T014 `README.md` に `arrows`・`arrowColor` の節（例・図・番号は回した後の位置・適用の順・両矢印・向きの決め方の例「揃えるには、`from` にあるピースが `to` へ行く」）、
  `stickerColors` が受け付けないオプションに `arrows`・`arrowColor` を足す、Errors の表に 4 行
- [X] T015 `README.ja.md` に、T014 と同じ内容を日本語で足す。2 つの README の見出し・コード例・画像・表の数が同じことを確かめる
- [X] T016 [P] 版を 1.2.0 にする：`npm version 1.2.0 --no-git-tag-version`
- [X] T017 最後の確認：`npm run build`・`npm run typecheck`・`npm test`・`npm run test:browser`・`npm run test:perf`（矢印付きの図も 10ms 未満）・
  `dependencies` が空・`npm pack --dry-run`・`git diff --exit-code test/svg`
- [X] T018 `spec.md` の Status を Implemented にし、このファイルのタスクに印を付ける

---

## Dependencies & Execution Order

- **Phase 1（T001）** → すべての前
- **US1（T002 → T003 → T004 → T005）** → ほかのストーリーの前（形と描く処理が無いと試せない）
- **US2（T006 → T007）**・**US3（T008）**・**US5（T009 → T010）**・**US4（T011）** は、どれも `test/arrows.test.ts`・`src/arrows.ts` を触るので順に進める
- **Polish**：T012・T013・T016 は別のファイルなので並べられる。T014 は T013 の図を使う。T015 は T014 の後。T017 は全部の後。T018 は最後

## Implementation Strategy

### MVP First

1. T001（型と名前）
2. US1（T002〜T005）で、矢印が SVG・canvas・PNG で描けるようにする
3. US2 で両矢印、US3・US5・US4 で組み合わせ・エラー・色を固める
4. Polish で文書と版を整え、PR にする。公開（Release）は、確認を取ってから行う（docs/releasing.md）
