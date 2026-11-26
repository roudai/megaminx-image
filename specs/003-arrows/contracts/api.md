# 公開の API の差分（1.1.0 → 1.2.0）

001 の `contracts/api.md`、002 の差分に対する差分だけを書く。入口・関数は変わらない。

## 共通の型

```ts
export interface ImageOptions extends StateOptions {
  // …1.1.0 のまま（size・lineColor・background）
  /** ステッカーからステッカーへの矢印。番号は rotate の後の図の上の位置。[a, b] と [b, a] は 1 本の両矢印にまとめる */
  arrows?: readonly (readonly [number, number])[];
  /** 矢印の色。既定 '#000000'。白い縁取りは固定 */
  arrowColor?: Color;
}
```

`StateOptions` には足さない（`stickerColors` では `Unknown option`）。`svg`・`drawCanvas`・`png` で使える。

## 例

```ts
svg({ case: h1, arrows: [[18, 15], [15, 12], [12, 24], [24, 21], [21, 18]] });
svg({ case: z1, arrows: [[12, 15], [15, 12], [18, 21], [21, 18]], arrowColor: 'r' });
```

## SVG の形（001 の「SVG の形」に足す）

`arrows` があるとき、最後の `</g>`（太い線）の後、`</svg>` の前に、次の 2 つの `<g>` をこの順で書く。

```text
<g fill="#ffffff" stroke="#ffffff" stroke-linejoin="miter" stroke-miterlimit="10">
  <path fill="none" stroke-width="{W + 2·HALO}" d="M x y L x y M x y L x y …"/>     … 全部の線
  <path stroke-width="{2·HALO}" d="M x y L x y L x y Z M …"/>                    … 全部の矢じり
</g>
<g fill="{arrowColor}" stroke="{arrowColor}" stroke-linejoin="miter" stroke-miterlimit="10">
  <path fill="none" stroke-width="{W}" d="…"/>
  <path stroke="none" d="…"/>
</g>
```

数値の書き方・属性の順は固定（001 と同じく `String(n)`、小数点以下 2 桁に丸める）。`arrows` が無いか空なら、何も書かない。

## エラー（001 の表に足す）

| 間違い | エラー |
|---|---|
| `arrows` が配列でない | `TypeError: "arrows" must be an array of [from, to] pairs (got 18)` |
| 矢印が `[from, to]` でない | `TypeError: Each arrow must be [from, to] (got [1,2,3])` |
| 矢印の番号が 0〜25 の整数でない | `RangeError: Sticker index out of range: 26 (expected 0-25)` |
| 矢印の 2 つの番号が同じ | `RangeError: An arrow must connect two different stickers (got [5,5])` |
| `arrowColor` が色でない | `TypeError: Unknown color: "orange"` |
| `stickerColors` に `arrows`・`arrowColor` | `TypeError: Unknown option: "arrows"` |

## 変わらないこと

- `arrows` を省いた・空にしたときの SVG の文字列・canvas への描き方・PNG
- `stickerColors` の結果、ステッカーの番号、ほかのエラー
