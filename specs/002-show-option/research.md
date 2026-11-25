# Research: 色を残すステッカーの指定（show）

技術的に分からないところ（NEEDS CLARIFICATION）は無い。決めたことを残す。

## R1. どこに足すか

- **Decision**: `src/stickers.ts` の `resolveColors` に、`rotate` の後・`stickers` の前の段として足す
- **Rationale**: `stickerColors`・`svg`・`drawCanvas`・`png` はどれも `resolveColors` を通るので、1 か所で全部に効く（FR-005）。
  `show` が無いときはこの段を飛ばすので、今の出力は変わらない（FR-009）
- **Alternatives considered**: 描画（`svg.ts`・`canvas.ts`）の側で灰色にする → 4 か所に同じ処理が要り、`stickerColors` に効かないので不採用

## R2. 番号の検証

- **Decision**: `show` が配列でなければ `TypeError: "show" must be an array of sticker indices (got <値>)`。
  要素が `typeof === 'number'` かつ整数かつ 0〜25 でなければ `RangeError: Sticker index out of range: <値> (expected 0-25)`
- **Rationale**: `stickers` の範囲の外のエラーと同じ文言にそろえる（spec の決定）。`<値>` は既存のエラーと同じ書き方
  （数はそのまま `26`・`NaN`、文字列は `"18"`）
- **Alternatives considered**: 文字列の `'18'` を数に直して受け付ける → 打ち間違いを黙って通すので不採用（原則 VI）

## R3. 上面の番号・重なり

- **Decision**: どちらも受け付ける。上面の番号は何もしない。重なりは 1 回と同じ
- **Rationale**: spec の決定（FR-008）。番号を集まりとして扱うので、並び順・重なりで結果は変わらない（原則 IV）

## R4. 配色に無い面

- **Decision**: 今のまま。色を決める（作り方の段）ときに、灰色にする面にも色が要る。無ければ `No color set for face`
- **Rationale**: 作り方の段は `show` を知らなくてよく、処理が単純なまま（spec の決定）

## R5. 内部の関数の名前

- **Decision**: `src/options.ts` の内部の関数 `show()`（エラーのメッセージに値を書く）を `describe()` に名前を変える
- **Rationale**: 新しいオプション `show` と同じ名前で、読む人がまぎらわしい。外に出していないので公開の API には影響しない

## R6. README の例の図

- **Decision**: `docs/images/show.svg` を足す。PLL のケースの 1 つに `rotate` と `show` を付けた図で、残した部分が
  「ブロック」（コーナーと両側のエッジの色がそろったところ）に見えるものを、PLL のデータから選ぶ
- **Rationale**: 何のための機能かが図で分かる。`scripts/readme-images.mjs` で作り直せる（原則 VIII）。
  選んだケース・向き・番号は実装のときに決め、スクリプトに書く
- **Alternatives considered**: 揃った状態に `show` を付ける → 何が残ったのか分かりにくいので不採用
