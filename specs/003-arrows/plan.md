# Implementation Plan: ステッカーからステッカーへの矢印（arrows）

**Branch**: `003-arrows` | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-arrows/spec.md`

## Summary

画像の設定に `arrows`（`[from, to]` の組の配列）と `arrowColor` を足す。新しい内部のモジュール `src/arrows.ts` で
入力を確かめて組をまとめ（行きと帰り → 両矢印、重なり → 1 本）、大きさ `size` の図の上の矢印の形
（線の 2 点と矢じりの三角形。小数点以下 2 桁に丸めた座標）を作る。`svg.ts` と `canvas.ts` はこの形を、
ステッカーと太い線の後に「白い縁取り → 矢印」の順で描く。PNG は SVG から作るのでそのまま効く。
`arrows` が無いか空なら、何も書き足さないので今の出力は変わらない。版は 1.2.0。

## Technical Context

**Language/Version**: TypeScript 5.9 → ES2020 の ES モジュール。Node.js 22.12 以上（001 と同じ）

**Primary Dependencies**: 変わらない（実行時の必須の依存なし）

**Storage**: N/A

**Testing**: Vitest（`test/arrows.test.ts` を足す。座標はスナップショット）、Playwright（3 種のブラウザーでの SVG の一致に、矢印のある図を足す）

**Target Platform**: 001 と同じ

**Project Type**: library（入口は 4 つのまま。新しい関数は無い）

**Performance Goals**: 1 枚 10ms 未満のまま（矢印 1 本は平方根 1 回と掛け算・足し算だけ）

**Constraints**: `arrows` が無いときの出力を変えない。矢印の座標もどの環境でも同じ文字列（平方根と割り算を使うので、research.md R2 で扱う）

**Scale/Scope**: オプション 2 つ、エラー 4 種、内部のモジュール 1 つ、README 2 つ、例の図 2 枚

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] I. 既存のサイトと同じ結果: 矢印はサイトに無い追加の機能。`arrows` が無いときの出力は変わらず、410 ケースの一致・SVG の正解ファイルのテストはそのまま通る
- [x] II. 依存なし・どこでも動く: 依存を足さない。矢印の形の計算は DOM・canvas に依存しない（`src/arrows.ts`）
- [x] III. テストを先に: `test/arrows.test.ts` を先に書き、失敗を確かめてから足す。誤りの入力・省いたときの不変・座標のスナップショットを試す
- [x] IV. 同じ入力なら同じ出力: 乱数・時刻を使わない。座標は小数点以下 2 桁に丸める。平方根は IEEE 754 で正しく丸めると決まっている `Math.sqrt` を使い（`Math.hypot` は使わない）、3 種のブラウザーで一致を確かめる（research.md R2）
- [x] V. 小さく安定した公開の API: 画像のオプションを 2 つ足すだけ（互換のある追加なのでマイナー版 1.2.0）。既存の見た目・並び順は変えない
- [x] VI. 間違いはエラーにする: 4 種のエラー（spec の User Story 5）。`stickerColors` では `Unknown option`
- [x] VII. 必要なものだけ作る: 実際の使い道（roudai.net の PLL の判断の図）がある。縁取りの色・矢じりの形などの設定は足さない
- [x] VIII. 文書: README（英語）・README.ja.md に節と例。例の図 `docs/images/arrows.svg`・`arrows-swap.svg` は `scripts/readme-images.mjs` で作り直せる。開発の文書は日本語

**再確認（Phase 1 の後）**: data-model・contracts を書いた後も、上の 8 つに反するところは無い。

## Project Structure

### Documentation (this feature)

```text
specs/003-arrows/
├── spec.md
├── plan.md              # このファイル
├── research.md          # 決めたこと（R1〜R7）
├── data-model.md        # 矢印の組のまとめ方・形の式・描く順
├── quickstart.md        # 確かめ方
├── contracts/api.md     # 公開の API の差分（ImageOptions の arrows・arrowColor、SVG の形、エラー 4 種）
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks で作る
```

### Source Code (repository root)

```text
src/
├── types.ts         # ImageOptions に arrows?・arrowColor? を足す（StateOptions には足さない）
├── options.ts       # IMAGE_KEYS に 'arrows'・'arrowColor' を足す（STATE_KEYS には足さない → stickerColors では Unknown option）
├── arrows.ts        # 新しい：checkArrows（確かめてまとめる）・arrowShapes（大きさ size の形）・寸法の定数
├── svg.ts           # 太い線の後に、白い縁取りの <g> と矢印の <g> を書き足す（arrows が空なら何も書かない）
└── canvas.ts        # 同じ形を、同じ順で描く

test/
├── arrows.test.ts   # 新しい：省いたときの不変・座標のスナップショット・両矢印・重なり・短い矢印・rotate・show・色・エラー・全経路
└── browser/svg-consistency.spec.ts   # 矢印のある入力を足す

scripts/readme-images.mjs   # arrows.svg（H1+ のエッジの 5 点交換）・arrows-swap.svg（両矢印）を足す
docs/images/arrows.svg, docs/images/arrows-swap.svg
README.md, README.ja.md     # arrows・arrowColor の節、向きの決め方の例、エラーの表に 4 行
package.json, package-lock.json   # version 1.2.0
```

**Structure Decision**: 001 の 1 つのライブラリの構成のまま。矢印の計算は `svg.ts` と `canvas.ts` で共有するため、
新しい内部のモジュール `src/arrows.ts` に分ける（`geometry.ts` と同じく、入口からは出さない）。

## Complexity Tracking

違反は無い。
