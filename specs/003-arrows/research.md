# Research: ステッカーからステッカーへの矢印（arrows）

技術的に分からないところ（NEEDS CLARIFICATION）は無い。決めたことを残す。

## R1. どこに足すか

- **Decision**: 新しい内部のモジュール `src/arrows.ts` に、入力の確かめとまとめ（`checkArrows`）、形の計算（`arrowShapes`）を置く。
  `svg.ts`・`canvas.ts` はその形を描くだけ。`png` は SVG から作るので変えない
- **Rationale**: SVG と canvas で同じ形・同じ順を使うため（001 の `geometry.ts` と同じ考え方）。色（`resolveColors`）とは関係しないので、
  `stickers.ts` には入れない
- **Alternatives considered**: `svg.ts` と `canvas.ts` にそれぞれ書く → 形がずれるおそれがあるので不採用

## R2. どの環境でも同じ座標にする

- **Decision**: 中心は `stickerPolygons(size)`（丸めた頂点）の頂点の平均。向きの長さは `Math.sqrt(dx * dx + dy * dy)`
  （`Math.hypot` は使わない）。出す座標はすべて `round`（小数点以下 2 桁）
- **Rationale**: 001 は三角関数を実行時に使わないことで環境の違いを避けた。矢印には平方根と割り算が要るが、どちらも IEEE 754 で
  正しく丸めると決まっている演算で、`Math.sqrt` は JavaScript の仕様でも近似を許されていない。`Math.hypot` は実装によって
  最後の桁が違うことがあるので使わない。3 種のブラウザーでの一致のテスト（`test/browser`）に矢印のある図を足して確かめる
- **Alternatives considered**: 26 × 25 = 650 通りの組の形を表にする → ファイルが大きくなり、大きさを掛けた後の丸めで結局計算が要るので不採用

## R3. 寸法と短い矢印

- **Decision**: 大きさ 200 で、線の太さ 3、矢じりの長さ 12・幅 11、中心から離す距離 7、縁取り片側 1.5。すべて `size / 200` を掛ける。
  両端を離した後の線の長さ `avail` が、矢じりの長さ × 個数（片矢印 1、両矢印 2）より短いときは、矢じりの長さと幅に
  `avail / (12k × 個数)` を掛けて縮める（`k = size / 200`）
- **Rationale**: 試作の図で見比べて決めた（spec の決定）。中心の間の最短は大きさ 200 で 25.2 なので、`avail` は最短でも 11.2 あり、0 以下にはならない

## R4. 白い縁取りの描き方

- **Decision**: すべての矢印の縁取り（白）を先に描き、その上にすべての矢印（`arrowColor`）を描く。縁取りは、線は太さ「3 + 1.5 × 2」の白い線、
  矢じりは白で塗って太さ「1.5 × 2」の白い線でふちどった三角形。角は miter（上限 10）、線の端は butt
- **Rationale**: 矢印ごとに縁取り → 矢印を描くと、後の矢印の縁取りが先の矢印を切ってしまう。全部の縁取りを先に描けば、交わる矢印もどちらも見える。
  矢じりの先の角は約 49° なので、miter は上限 10 の内側に収まり、どの描き方でも同じ形になる

## R5. まとめ方

- **Decision**: 入力の順に見て、`[a, b]` がまだ出ていなければ 1 本として足す。すでに `[a, b]` があれば無視、`[b, a]` があればその 1 本を両矢印にする。
  両矢印の線の向きは、先に出た組（`[from, to]`）のまま
- **Rationale**: spec の FR-006・FR-007。両矢印でも、座標の並び（どちらの端から書くか）が決まるので、同じ入力から同じ文字列になる

## R6. stickerColors での扱い

- **Decision**: `arrows`・`arrowColor` は `IMAGE_KEYS` にだけ足し、`STATE_KEYS` には足さない
- **Rationale**: `size`・`lineColor` と同じ扱いで、`stickerColors` では `Unknown option` になる（spec の決定）

## R7. README の例の図

- **Decision**: `docs/images/arrows.svg`：H1+ の `case` に `[[18, 15], [15, 12], [12, 24], [24, 21], [21, 18]]`（エッジの 5 点交換。
  「今そこにあるエッジが、揃えると行く位置」へ向かう）。`docs/images/arrows-swap.svg`：Z1 の `case` に
  `[[12, 15], [15, 12], [18, 21], [21, 18]]`（2 組の両矢印）
- **Rationale**: H1+ の矢印の組は、`case` の図の色から計算した組と一致することを確かめてある（spec の SC-002）。Z1 も同じ計算で 2 組の 2 点交換になる
