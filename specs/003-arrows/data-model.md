# Data Model: ステッカーからステッカーへの矢印（arrows）

## arrows

- 型：`[from, to]` の組の配列。`from`・`to` は 0〜25 の整数で、違う番号
- 番号は `rotate` を適用した後の図の上の位置（`show`・`stickers` と同じ）。つまり矢印は図の上の決まった位置を指し、`rotate` を変えても同じ位置に描かれる

## まとめ（`checkArrows` の結果）

入力の順に見て、次の 1 本の並びにする。

| 入力 | 結果 |
|---|---|
| `[a, b]` がまだ無い | `{ from: a, to: b, both: false }` を足す |
| `[a, b]` がすでにある | 何もしない |
| `[b, a]` がすでにある | その 1 本を `both: true` にする（`from`・`to` は先に出たまま） |

## 形（`arrowShapes(size, list)`）

`k = size / 200`。寸法：`W = 3k`（線の太さ）、`H = 12k`（矢じりの長さ）、`HW = 11k`（矢じりの幅）、`GAP = 7k`、`HALO = 1.5k`。

1 本ごとに：

```text
c1, c2 = from・to のステッカーの中心（stickerPolygons(size) の頂点の平均）
L      = sqrt((c2 - c1)²)            u = (c2 - c1) / L        n = (-u.y, u.x)
s      = c1 + u·GAP                  e = c2 - u·GAP           avail = L - 2·GAP
m      = both ? 2 : 1                f = min(1, avail / (m·H))
h      = H·f                         w = HW·f
線     = (both ? s + u·h : s) → e - u·h
矢じり = 先 e、底 e - u·h ± n·w/2               （both なら、もう 1 つ：先 s、底 s + u·h ± n·w/2）
```

出す座標（線の 2 点・矢じりの 3 点）はすべて小数点以下 2 桁に丸める。太さ `W`・縁取りの太さは `lineWidths` と同じく丸める。

## 描く順

```text
ステッカー → 太い線 → すべての矢印の白い縁取り → すべての矢印（arrowColor）
```

- 縁取り：線は太さ `W + 2·HALO` の白（`#ffffff`）の線。矢じりは白で塗り、太さ `2·HALO` の白い線でふちどる
- 矢印：線は太さ `W` の `arrowColor` の線。矢じりは `arrowColor` で塗る（ふちどらない）
- 角は miter（上限 10）、線の端は butt
- `arrows` が無いか、まとめた結果が空なら、何も描かない

## 検証

| 入力 | 結果 |
|---|---|
| `undefined`・`[]` | 何も描かない |
| 配列でない | `TypeError: "arrows" must be an array of [from, to] pairs (got <値>)` |
| 要素が「長さ 2 の配列で、2 つとも数」でない | `TypeError: Each arrow must be [from, to] (got <値>)` |
| 番号が 0〜25 の整数でない | `RangeError: Sticker index out of range: <値> (expected 0-25)` |
| `from === to` | `RangeError: An arrow must connect two different stickers (got <値>)` |
| `arrowColor` が色でない | `TypeError: Unknown color: <値>`（ほかの色と同じ） |

`<値>` は既存のエラーと同じ書き方（`describe`。配列は `[5,5]`）。
