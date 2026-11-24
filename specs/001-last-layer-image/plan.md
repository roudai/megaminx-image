# Implementation Plan: メガミンクスの最後の層の画像ライブラリ（megaminx-image）

**Branch**: `001-last-layer-image` | **Date**: 2026-11-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-last-layer-image/spec.md`

## Summary

メガミンクスの最後の層（U 面 11 枚 ＋ 側面の上段 15 枚）の画像を、回転記号の手順・色の指定から作る npm ライブラリ
`megaminx-image` を作る。既存のサイト `MegaminxImageEditor` の状態計算（`js/megaminx-state.js`）と
描画の形（`js/megaminx-draw.js`）を TypeScript に書き写し、SVG の文字列を中心に、canvas・PNG・26 色の並びを出す。画像の向き（U を k 回回した向き）も指定できる。
サイトのコードから書き出した正解データ（PLL・OLL の 410 件と記法の境目）で、サイトと同じ結果であることを
常に確かめる。座標は三角関数を実行時に使わず表から求め、どの環境でも同じ SVG の文字列にする。

## Technical Context

**Language/Version**: TypeScript 5.x → ES2020 の ES モジュール。Node.js 22.12 以上（開発は 24）

**Primary Dependencies**: 実行時の必須の依存なし。任意：`@resvg/resvg-js`（PNG だけ）。
開発：`typescript`・`vitest`・`playwright`・`@resvg/resvg-js`

**Storage**: N/A（正解データ・ケースのデータはリポジトリのファイル）

**Testing**: Vitest（Node.js）、Playwright（Chromium・Firefox・WebKit で SVG の一致）

**Target Platform**: Node.js 22.12 以上、ES2020 が動くブラウザ（canvas は `OffscreenCanvas` も）

**Project Type**: library（npm パッケージ、入口 4 つ）

**Performance Goals**: 1 枚 10ms 未満（Node.js、読み込み直後の 1 回を除く 1,000 枚の平均）

**Constraints**: 必須の依存 0、DOM・canvas に依存しない本体、同じ入力でバイト単位で同じ SVG、
サイトと同じ 26 色・同じ記法の読み方

**Scale/Scope**: 公開の関数 6 つ＋定数 2 つ（本体）、`drawCanvas`・`png`・ケースのデータ 410 件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

設計のあと（Phase 1 のあと）にもう一度確かめた結果。

- [x] I. 既存のサイトと同じ結果：状態計算をサイトから書き写し、410 件 × case・alg と記法の境目を
  サイトのコードから書き出した正解データで確かめる（R3・R4）。サイトと違うところは下の「サイトとの違い」
- [x] II. 依存なし・どこでも動く：`dependencies` は空。PNG だけ任意の `peerDependencies`。本体は DOM・canvas を
  使わず、canvas は `megaminx-image/canvas` に分ける。型定義を出す（R1・R2・R7・R8）
- [x] III. テストを先に：タスクは各機能でテストを先に書く。正解データのテストと記法の境目・エラーのテストを持つ（R4）
- [x] IV. 同じ入力なら同じ出力：乱数・時刻を使わない。座標は表から求め、小数第 2 位に丸める。
  ブラウザ 3 種と Node.js で文字列の一致を確かめる（R5・R11）
- [x] V. 小さく安定した公開の API：公開するものは `contracts/api.md` だけ。132 枚の内部の状態・読んだ手順・
  座標は公開しない。SVG の形と並び順も約束に含める。最初の版は 1.0.0（R13）
- [x] VI. 間違いはエラーにする：手順・色・面・番号・大きさ・設定の名前の間違いは、標準のエラーの型で、
  どこが悪いかをメッセージに書く（R10）
- [x] VII. 必要なものだけ作る：最後の層の画像だけ。ファイルに書く関数・色の名前・独自のエラーの型は作らない。
  内部の状態は 132 枚の全体を持つので、全体の展開図はあとで足せる
- [x] VIII. 文書：README（英語）に記法・作り方 3 種・配色・出力・並び順。例の画像はスクリプトで作り、
  作り直して変わらないことをテストする（R12）。開発の文書は日本語

### サイトとの違い（原則 I に照らして）

色の結果・記法の読める範囲は変えない。次はサイトに無いもの・画面の都合のもので、色の結果に影響しない。

| 違い | 理由 |
|---|---|
| エラーのメッセージに位置を足す | 原則 VI（どこが悪いか分かる）。メッセージの前半はサイトと同じ |
| `canonicalAlg` が読めない手順をエラーにする | 原則 VI。サイトは置き換えだけして返す。読める手順の結果は同じ |
| `invertAlg`（文字列の逆の手順）を足す | 仕様 FR-016。サイトは手順の内部の形でしか逆を作らない |
| `simplifyAlg` は文字列だけを返す（`changed` を返さない） | 原則 V（公開を小さく）。文字列はサイトと同じ |
| SVG を出す | 仕様 FR-023。形・太さ・順はサイトの canvas と同じ |
| 大きさの範囲（サイトは 100〜1000）を設けない | 画面の都合の制限のため。0 より大きければよい |

## Project Structure

### Documentation (this feature)

```text
specs/001-last-layer-image/
├── plan.md              # この計画
├── research.md          # Phase 0：調べて決めたこと
├── data-model.md        # Phase 1：データの形
├── quickstart.md        # Phase 1：動くことを確かめる手順
├── contracts/
│   ├── api.md           # 公開の API・SVG の形・エラー
│   └── notation.md      # 回転記号の読み方・道具
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2（/speckit-tasks で作る）
```

### Source Code (repository root)

```text
src/
├── index.ts             # 入口 megaminx-image（公開するものだけを export）
├── notation.ts          # 読む前の置き換え・parseAlg・canonicalAlg・invertAlg・simplifyAlg
├── state.ts             # 132 枚の状態・回転の置換・applyAlg・上面の取り出し
├── colors.ts            # 色コード・16 進・検証・DEFAULT_SCHEME・ollScheme
├── stickers.ts          # 入力の検証・作り方の振り分け・26 色の並び（stickerColors）
├── geometry-table.ts    # 大きさ 1 の点の表（生成）
├── geometry.ts          # 多角形・線の太さ・丸め
├── svg.ts               # SVG の文字列
├── canvas.ts            # 入口 megaminx-image/canvas
├── png.ts               # 入口 megaminx-image/png
└── cases/
    ├── index.ts         # 入口 megaminx-image/cases
    ├── types.ts         # CaseEntry
    ├── pll.ts           # 生成（サイトから）
    └── oll.ts           # 生成（サイトから）

scripts/
├── export-from-site.mjs     # サイトから正解データ・ケースのデータを書き出す
├── build-geometry-table.mjs # 大きさ 1 の点の表を作る
└── build-readme-images.mjs  # README の画像の例を作る

test/
├── golden/              # cases.json・notation.json・geometry.json（サイトから書き出し）
├── notation.test.ts
├── notation-tools.test.ts  # canonicalAlg・invertAlg・simplifyAlg
├── options.test.ts         # 設定の検証とエラー
├── stickers-options.test.ts # 配色・直接指定・上書き・向き
├── svg-appearance.test.ts  # 大きさ・線の色・背景
├── svg/solved-200.svg      # SVG の全文の比べ先
├── geometry.test.ts
├── state.test.ts
├── colors.test.ts
├── stickers.test.ts     # 正解データ（410 件）との一致
├── svg.test.ts
├── canvas.test.ts       # canvas の呼び出しを記録する偽物で確かめる
├── png.test.ts
├── cases.test.ts
├── readme-images.test.ts
├── perf.test.ts
└── browser/             # Playwright：ブラウザ 3 種で SVG の一致

.github/
├── workflows/ci.yml     # 変更を取り込む前の確認（原則の品質ゲート）
└── pull_request_template.md

docs/images/             # README の画像の例（生成）
README.md                # 英語
LICENSE                  # MIT
```

**Structure Decision**: 1 つのパッケージ（ライブラリ）。`src/` に公開の入口 4 つと内部の部品を置き、
`package.json` の `exports` で `.`・`./canvas`・`./png`・`./cases` だけを外に出す。サイトから作るものは
`scripts/` のスクリプトで生成し、生成した結果もリポジトリに入れる（サイトが無くてもテストできるように）。

## Complexity Tracking

原則に反するところは無い。
