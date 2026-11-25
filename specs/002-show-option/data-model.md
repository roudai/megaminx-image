# Data Model: 色を残すステッカーの指定（show）

001 の data-model.md の「ステッカーの色の並び」（26 色、番号 0〜25）に、1 段を足す。

## show

- 型：ステッカーの番号（0〜25 の整数）の配列。省略できる
- 意味：番号の**集まり**。並び順・重なりに意味は無い
- 上面の番号（0〜10）は、あっても何もしない

## 色を決める順

```text
作り方（alg・case・state） → 向き（rotate） → show → 上書き（stickers）
```

- `show` の番号は、`rotate` の**後**の位置
- `stickers` は `show` の後なので、灰色にしたところも色を変えられる

## show の段

`colors` を `rotate` の後の 26 色、`S` を `show` の番号の集まりとすると、`show` の段の後の色 `out` は：

```text
out[i] = colors[i]   (i が 0〜10、または i が S に入っている)
out[i] = 'd'         (i が 11〜25 で、S に入っていない)
```

`show` が無い（`undefined`）ときは、この段を飛ばす（`out = colors`）。

## 検証

| 入力 | 結果 |
|---|---|
| `undefined` | この段を飛ばす |
| 配列でない（数・文字列・オブジェクト・`null` など） | `TypeError: "show" must be an array of sticker indices (got <値>)` |
| 要素が数でない・整数でない・0〜25 の外 | `RangeError: Sticker index out of range: <値> (expected 0-25)` |
| 要素が 0〜10 | 受け付ける（何もしない） |
| 同じ番号が 2 回以上 | 受け付ける |
