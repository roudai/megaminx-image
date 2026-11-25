# Implementation Plan: 色を残すステッカーの指定（show）

**Branch**: `002-show-option` | **Date**: 2026-11-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-show-option/spec.md`

## Summary

色を決める設定に `show`（色を残すステッカーの番号の配列）を足す。`show` があるとき、側面の上段（11〜25）のうち
`show` に無いものを濃い灰色 'd' にする。色を決める処理（`src/stickers.ts` の `resolveColors`）の
「向き（`rotate`）」と「上書き（`stickers`）」の間に 1 段足すだけで、`stickerColors`・`svg`・`drawCanvas`・`png` の
すべてに効く（どれもこの処理を通る）。`show` が無いときはこの段を通らないので、今の出力は 1 バイトも変わらない。
版は 1.1.0。

## Technical Context

**Language/Version**: TypeScript 5.9 → ES2020 の ES モジュール。Node.js 22.12 以上（001 と同じ）

**Primary Dependencies**: 変わらない（実行時の必須の依存なし）

**Storage**: N/A

**Testing**: Vitest（`test/show.test.ts` を足す）。README の画像の一致のテスト（`test/readme-images.test.ts`）に新しい図が加わる

**Target Platform**: 001 と同じ

**Project Type**: library（入口は 4 つのまま。新しい関数は無い）

**Performance Goals**: 1 枚 10ms 未満のまま（`show` の段は 15 枚を見るだけ）

**Constraints**: `show` が無いときの出力を変えない（`test/svg/`・410 ケースの一致のテストがそのまま通る）

**Scale/Scope**: オプション 1 つ、エラー 2 種、README 2 つ、例の図 1 枚

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] I. 既存のサイトと同じ結果: `show` はサイトに無い追加の機能。指定しないときの 26 色は変わらず、410 ケースの一致のテストはそのまま通る。
  `show` の結果は「1.0.0 の結果に `stickers` で 'd' を上書きしたもの」と同じことで確かめる
- [x] II. 依存なし・どこでも動く: 依存を足さない。色の計算だけの変更で、DOM・canvas に触れない
- [x] III. テストを先に: `test/show.test.ts` を先に書き、失敗を確かめてから足す。誤りの入力・指定しないときの不変も試す
- [x] IV. 同じ入力なら同じ出力: 乱数・時刻を使わない。`show` の並び順・重なりで結果が変わらない
- [x] V. 小さく安定した公開の API: オプションを 1 つ足すだけ（互換のある追加なのでマイナー版 1.1.0）。見た目・並び順は変えない
- [x] VI. 間違いはエラーにする: 配列でない → `TypeError`、番号が 0〜25 の整数でない → `RangeError`（`stickers` と同じ文言）。
  上面の番号・重なりは誤りではないので受け付ける（spec の決定）
- [x] VII. 必要なものだけ作る: 実際の使い道（roudai.net の PLL の説明の図）がある。灰色の色を変える設定は足さない
- [x] VIII. 文書: README（英語）・README.ja.md に説明と例。例の図 `docs/images/show.svg` は `scripts/readme-images.mjs` で作り直せる。
  開発の文書は日本語

**再確認（Phase 1 の後）**: data-model・contracts を書いた後も、上の 8 つに反するところは無い。

## Project Structure

### Documentation (this feature)

```text
specs/002-show-option/
├── spec.md
├── plan.md              # このファイル
├── research.md          # 決めたこと（R1〜R6）
├── data-model.md        # 色を決める順と show の段
├── quickstart.md        # 確かめ方
├── contracts/api.md     # 公開の API の差分（StateOptions の show・エラー 2 種）
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks で作る
```

### Source Code (repository root)

```text
src/
├── types.ts         # StateOptions に show?: readonly number[] を足す
├── options.ts       # STATE_KEYS に 'show' を足す。内部の関数 show() を describe() に名前を変える
└── stickers.ts      # resolveColors に rotate → show → stickers の段を足す（applyShow）

test/
└── show.test.ts     # 新しい：基本・rotate との組み合わせ・stickers との順・state・誤りの入力・指定しないときの不変・全経路

scripts/readme-images.mjs   # show.svg を足す
docs/images/show.svg        # 作り直した図
README.md, README.ja.md     # 説明と例・エラーの表に 2 行
package.json, package-lock.json   # version 1.1.0
```

**Structure Decision**: 001 の 1 つのライブラリの構成のまま。新しいファイルはテスト 1 つと図 1 枚だけ。

## Complexity Tracking

違反は無い。
