# 公開の API の差分（1.0.0 → 1.1.0）

001 の `contracts/api.md` に対する差分だけを書く。入口・関数・ほかのオプションは変わらない。

## 共通の型

```ts
export interface StateOptions {
  // …1.0.0 のまま（alg・case・state・start・rotate・stickers・scheme）
  /** 色を残すステッカーの番号（0〜25）。側面の上段（11〜25）のうち、ここに無いものを 'd' にする。上面は変えない */
  show?: readonly number[];
}
```

`ImageOptions` は `StateOptions` を広げたものなので、`svg`・`drawCanvas`・`png` でも使える。

- 順は「作り方 → 向き（`rotate`）→ `show` → 上書き（`stickers`）」
- 番号は `rotate` の後の位置

## 例

```ts
svg({ case: alg, size: 100, rotate: 2, show: [18, 19, 20, 21] });
stickerColors({ show: [] }); // 側面の 15 枚がすべて 'd'
stickerColors({ alg: 'R', show: [17], stickers: { 11: 'r' } }); // 11 は 'r'
```

## エラー（001 の表に足す）

| 間違い | エラー |
|---|---|
| `show` が配列でない | `TypeError: "show" must be an array of sticker indices (got 18)` |
| `show` の要素が 0〜25 の整数でない | `RangeError: Sticker index out of range: 26 (expected 0-25)` |

## 変わらないこと

- `show` を指定しないときの 26 色・SVG の文字列・canvas への描き方・PNG
- ステッカーの番号・見た目・ほかのエラー
