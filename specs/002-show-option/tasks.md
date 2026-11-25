---

description: "show オプション（色を残すステッカーの指定）のタスク"
---

# Tasks: 色を残すステッカーの指定（show）

**Input**: `specs/002-show-option/` の plan.md・spec.md・research.md・data-model.md・contracts/api.md・quickstart.md

**Tests**: 原則 III（テストを先に）により必須。テストを先に書き、`npx vitest run test/show.test.ts` で
**失敗することを確かめてから**実装する。`show` を指定しないときの出力が変わらないことは、1.0.0 からのテスト
（410 ケースのサイトとの一致・`test/svg/` の正解ファイル）がそのまま通ることで確かめる。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並べて進められる（別のファイルで、終わっていないタスクに依存しない）
- **[Story]**: 対応するユーザーストーリー（US1〜US3。spec.md）

---

## Phase 1: Foundational（下準備）

**Purpose**: 新しいオプションと名前がかぶる内部の関数を、先に名前を変えておく

- [X] T001 `src/options.ts` の内部の関数 `show()` を `describe()` に名前を変え、使っているところ（`src/options.ts`・
  `src/stickers.ts`）も直す（research.md R5）。公開の API・エラーの文言は変えない。`npm test` と `npm run typecheck` が通ることを確かめる

**Checkpoint**: 1.0.0 のテストがすべて通り、ふるまいは何も変わっていない

---

## Phase 2: User Story 1 - 指定したステッカーだけ色を残す（Priority: P1）🎯 MVP

**Goal**: `show` に無い側面の上段を 'd' にする。上面は変えない。`stickerColors`・`svg`・`drawCanvas`・`png` のすべてで効く

**Independent Test**: `show` を付けた結果が、同じ指定に「`show` に無い側面を 'd' にする `stickers`」を付けた結果と同じになる

### Tests for User Story 1

- [X] T002 [US1] `test/show.test.ts` を作り、次を書く（この時点では失敗することを確かめる）
  - `stickerColors({ show: [17, 18, 19] })`：17〜19 は 'a'、ほかの側面（11〜16・20〜25）は 'd'、0〜10 は 'u'
  - `show: []`：11〜25 がすべて 'd'、0〜10 は変わらない
  - 11〜25 をすべて並べると、`show` なしと同じ 26 色
  - 上面の番号（例：`[0, 5, 17]`）・重なり（`[17, 17, 18]`）・並び順（`[19, 17]` と `[17, 19]`）で結果が変わらない
  - `show: undefined` は `show` なしと同じ
  - SC-001：PLL の全 151 ケースについて、いくつかの `show`（`[]`・`[17, 18, 19]`・`[18, 19, 20, 21]`・`[11, 25]`）で、
    `stickerColors({ case, show })` が「`stickerColors({ case })` の、`show` に無い側面を 'd' にしたもの」と同じ
  - 全経路：`svg({ case, show })` が `svg({ case, stickers: <同じ灰色の上書き> })` と同じ文字列。
    `drawCanvas` も同じく、上書きで描いたときと同じ描き方（001 の `test/canvas.test.ts` の記録する偽の canvas を使う）。
    `png` も同じく、上書きで作ったときと同じバイト列

### Implementation for User Story 1

- [X] T003 [US1] `src/types.ts` の `StateOptions` に `show?: readonly number[]` を足し、説明のコメントを書く（contracts/api.md）。
  `src/options.ts` の `STATE_KEYS` に `'show'` を足す（`IMAGE_KEYS` にも入る）
- [X] T004 [US1] `src/stickers.ts` の `resolveColors` に、`rotate` の後・`stickers` の前で `show` の段（`applyShow`）を足す
  （data-model.md「show の段」）。`show` が `undefined` なら飛ばす。冒頭のコメントの順の説明も直す。T002 が通ることを確かめる

**Checkpoint**: US1 のテストと、1.0.0 からのテストがすべて通る

---

## Phase 3: User Story 2 - 向き・上書きと組み合わせる（Priority: P1）

**Goal**: 順「作り方 → `rotate` → `show` → `stickers`」をテストで固定する

**Independent Test**: `rotate` と `show` を一緒に渡した結果が、`rotate` だけの 26 色に `show` の段を当てたものと同じ

### Tests for User Story 2

- [X] T005 [US2] `test/show.test.ts` に次を足す（T004 の実装で通るはずだが、順を固定するテストとして足す。
  わざと順を入れ替えた実装で失敗することを一度確かめる）
  - `rotate: 2, show: [18, 19, 20, 21]`：PLL の全ケースで、「`rotate: 2` だけの 26 色」の 18〜21 以外の側面を 'd' にしたものと同じ
    （番号は向きを変えた後の位置）
  - `show: [17], stickers: { 11: 'r' }`：11 は 'r'（`stickers` は `show` の後）
  - `state` ＋ `show`：`alg` と同じく灰色にする
  - `start` ＋ `case` ＋ `show`：`start` を付けた 26 色に `show` の段を当てたものと同じ

**Checkpoint**: 組み合わせのテストが通る

---

## Phase 4: User Story 3 - 誤った指定をエラーにする（Priority: P2）

**Goal**: 誤った `show` を、決めた種類と文言のエラーにする（原則 VI）

**Independent Test**: 誤った `show` を渡すと、決めたエラーになる

### Tests for User Story 3

- [X] T006 [US3] `test/show.test.ts` に次を足し、失敗することを確かめる
  - 配列でない `18`・`'18'`・`{}`・`null`・`true` → `TypeError: "show" must be an array of sticker indices (got 18)` など
    （`<値>` はほかのエラーと同じ書き方）
  - 要素が `26`・`-1`・`1.5`・`NaN`・`'18'`・`null` → `RangeError: Sticker index out of range: 26 (expected 0-25)` など
  - `svg`・`drawCanvas`・`png` でも同じエラーになる（どれか 1 つの誤りの入力で、3 つとも同じ種類・文言）

### Implementation for User Story 3

- [X] T007 [US3] `src/stickers.ts` の `applyShow` に検証を足す（research.md R2、data-model.md「検証」）。T006 が通ることを確かめる

**Checkpoint**: すべてのユーザーストーリーのテストが通る

---

## Phase 5: Polish（文書・版・最後の確認）

- [X] T008 [P] `scripts/readme-images.mjs` に `show.svg` を足す。PLL のデータから、`rotate` と `show` で残した部分が
  「ブロック」（コーナーと両側のエッジの色がそろったところ）に見えるケース・向き・番号を探して決め、スクリプトにコメントで理由を書く
  （research.md R6）。`npm run build:readme-images` で `docs/images/show.svg` を作り、ほかの図が変わらないことを
  `git diff docs/images` で確かめる。`test/readme-images.test.ts` が通る
- [X] T009 `README.md` に `show` を足す：「More options for the state」に説明と例と図（`docs/images/show.svg`）、
  順の説明（`rotate` → `show` → `stickers`）、Errors の表に 2 行（contracts/api.md）
- [X] T010 `README.ja.md` に、T009 と同じ内容を日本語で足す。2 つの README の見出し・コード例・画像の数が同じことを確かめる
- [X] T011 [P] 版を 1.1.0 にする：`npm version 1.1.0 --no-git-tag-version`（`package.json`・`package-lock.json`）
- [X] T012 最後の確認：`npm run build`・`npm run typecheck`・`npm test`・`npm run test:browser`・`npm run test:perf`
  （1 枚 10ms 未満、SC-004）・`dependencies` が空・`npm pack --dry-run`（ファイルの数は 36。1.0.0 の 35 に、README.ja.md が加わる。npm は README で始まるファイルを `files` に関係なく入れる）。
  quickstart.md の手で見る手順で、`show` を付けた図を目で確かめる
- [X] T013 `spec.md` の Status を Implemented にし、このファイルのタスクに印を付ける

---

## Dependencies & Execution Order

- **Phase 1（T001）** → すべての前（名前がかぶるので先に変える）
- **US1（T002 → T003 → T004）** → US2・US3 の前（`show` の段が無いと、組み合わせ・検証を試せない）
- **US2（T005）** と **US3（T006 → T007）** は、どちらも `test/show.test.ts` と（US3 は）`src/stickers.ts` を触るので、順に進める
- **Polish**：T008・T011 は並べて進められる。T009 は T008 の図を使う。T010 は T009 の後。T012 は全部の後。T013 は最後

### Parallel Opportunities

- T008（README の図のスクリプト）と T011（版）は別のファイルなので並べられる
- それ以外は同じファイル（`test/show.test.ts`・`src/stickers.ts`・README）を触るので順に進める

## Implementation Strategy

### MVP First

1. T001（名前を変える）
2. US1（T002〜T004）で、`show` の基本が全経路で使えるようにする → ここで止めても roudai.net の使い方はできる
3. US2・US3 で順とエラーを固める
4. Polish で文書と版を整え、PR にする。公開（Release）はユーザーの指示で行う（docs/releasing.md）
