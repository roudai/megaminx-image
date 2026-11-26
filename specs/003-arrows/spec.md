# Feature Specification: ステッカーからステッカーへの矢印（arrows）

**Feature Branch**: `003-arrows`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "megaminx-image に、ステッカーからステッカーへ矢印を描くオプション arrows と arrowColor を足す。PLL の図で、ピースの動き（エッジの 5 点交換、コーナーの 3 点交換など）を矢印で示したい"

## 背景

roudai.net の Megaminx PLL のページでは、判断の図に矢印を重ねて、「エッジがすべて時計回りに動く」などを見せたい。
今のライブラリには矢印を描く機能が無い。ステッカーの番号（README の「Sticker order」の 0〜25）を 2 つ並べるだけで、
その間に矢印を描けるようにする。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - ステッカーの間に矢印を描く（Priority: P1）

PLL の説明の図を作る人が、ケースの手順と、矢印の始まりと終わりのステッカーの番号の組を渡す。
始まりのステッカーの中心から終わりのステッカーの中心へ向かう直線に、終わりの側の矢じりが付いた矢印が、図のいちばん上に描かれる。

**Why this priority**: この機能の目的そのもの。

**Independent Test**: H1+ の `case` の図に `arrows: [[18, 15], [15, 12], [12, 24], [24, 21], [21, 18]]` を付けると、
5 本の矢印が描かれ、その座標が決まった値（スナップショット）になる。

**Acceptance Scenarios**:

1. **Given** H1+ の手順、**When** 上の 5 本の `arrows` で SVG を作る、**Then** 5 本の矢印が、ステッカーと線より後（いちばん上）に描かれる
2. **Given** 1 本の矢印、**When** SVG を作る、**Then** 線の両端はステッカーの中心から離れ（大きさ 200 で 7）、終わりの側に矢じりが付く
3. **Given** 同じ指定、**When** SVG・canvas・PNG で作る、**Then** どれも同じ矢印を描く
4. **Given** 同じ指定、**When** どの環境（Node.js・3 種のブラウザー）で SVG を作っても、**Then** 1 バイトも違わない文字列になる
5. **Given** 任意の指定、**When** `arrows` を省く・空の配列にする、**Then** 1.1.0 と 1 バイトも違わない出力になる

---

### User Story 2 - 行きと帰りを 1 本の両矢印にまとめる（Priority: P1）

2 点交換を示すため、同じ 2 枚の間の行きと帰り（`[a, b]` と `[b, a]`）を、両端に矢じりの付いた 1 本の矢印にまとめる。

**Why this priority**: PLL の説明では 2 点交換がよく出る。2 本の矢印が重なると読めない。

**Independent Test**: `[[12, 15], [15, 12]]` の図が、両端に矢じりの付いた 1 本の矢印だけになる。

**Acceptance Scenarios**:

1. **Given** `[[12, 15], [15, 12]]`、**When** SVG を作る、**Then** 両矢印が 1 本だけ描かれる
2. **Given** `[[12, 15], [12, 15]]`（同じ矢印を 2 回）、**When** SVG を作る、**Then** 1 本だけ描かれる（エラーにしない）
3. **Given** 隣り合う 2 枚（中心の間が短い）の両矢印、**When** SVG を作る、**Then** 矢じりは入る長さまで縮められ、互いに重ならない

---

### User Story 3 - 向き・show と組み合わせる（Priority: P2）

ケースを別の向きで見せたり、一部だけ色を残したりした図にも、矢印を重ねる。

**Why this priority**: サイトでは `rotate`・`show` と一緒に使う。番号の数え方が決まっていないと、矢印の位置がずれる。

**Independent Test**: `rotate` を変えても、同じ `arrows` の矢印は図の上の同じ位置に描かれる。

**Acceptance Scenarios**:

1. **Given** 同じ `arrows`、**When** `rotate` を 0 と 2 で作る、**Then** 矢印の座標は同じ（番号は回した後の図の上の位置）
2. **Given** `show` と `arrows`、**When** SVG を作る、**Then** 灰色にした図の上に矢印が描かれる
3. **Given** 任意の指定、**When** `stickerColors` に `arrows` か `arrowColor` を渡す、**Then** `size` などと同じく `TypeError: Unknown option` になる（色には関係しないため）

---

### User Story 4 - 色を変える（Priority: P3）

矢印の色を `arrowColor` で変える。

**Why this priority**: 既定の黒（白い縁取り付き）で読めるので、色を変えるのは補助。

**Acceptance Scenarios**:

1. **Given** `arrowColor: 'r'`、**When** SVG を作る、**Then** 矢印の線と矢じりが赤（`#ff0000`）。白い縁取りはそのまま
2. **Given** `arrowColor` を省く、**When** SVG を作る、**Then** 黒（`#000000`）

---

### User Story 5 - 誤った指定をエラーにする（Priority: P2）

番号や形の間違いを、それらしく見える図にせずにエラーで知らせる（原則 VI）。

**Acceptance Scenarios**:

1. **Given** `arrows` が配列でない（`18`・`'a'`・`{}`・`null`）、**Then** `TypeError: "arrows" must be an array of [from, to] pairs (got …)`
2. **Given** 要素が 2 つの数の配列でない（`18`・`[1]`・`[1, 2, 3]`・`['1', 2]`・`null`）、**Then** `TypeError: Each arrow must be [from, to] (got …)`
3. **Given** 番号が 0〜25 の整数でない（`26`・`-1`・`1.5`・`NaN`）、**Then** `RangeError: Sticker index out of range: … (expected 0-25)`
4. **Given** `from` と `to` が同じ（`[5, 5]`）、**Then** `RangeError: An arrow must connect two different stickers (got [5,5])`
5. **Given** `arrowColor` が色でない（`'orange'`）、**Then** ほかの色と同じ `TypeError: Unknown color: "orange"`

---

### Edge Cases

- `arrows` が空の配列：矢印を描かない（省いたときと同じ出力）
- 隣り合う 2 枚の間の矢印（中心の間が大きさ 200 で 25.2）：線が矢じりより短くなるときは、矢じりを入る長さまで縮める
- 1 本の矢印と、その逆向きが離れた位置に書かれていても（例：`[[12, 15], [18, 21], [15, 12]]`）、1 本の両矢印にまとめる。
  描く順は、組のうち先に出た方の位置
- 上面の中心（番号 0）も、矢印の始まり・終わりにしてよい
- `arrows` があり、`size` が小さい（例：50）とき：寸法は大きさに比例して小さくなる
- `arrowColor` が `background` と同じ色でも、エラーにしない（白い縁取りで見分けられる）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 画像を作る設定（SVG・canvas・PNG）に、オプション `arrows`（`[from, to]` の組の配列）を足さなければならない（MUST）。
  `from`・`to` はステッカーの番号（0〜25）
- **FR-002**: 矢印は、`from` のステッカーの中心から `to` のステッカーの中心へ向かう直線で、`to` の側に矢じりを付けなければならない（MUST）。
  中心は、ステッカーの多角形の頂点の平均とする
- **FR-003**: 線の両端は、ステッカーの中心から大きさ 200 で 7 だけ離さなければならない（MUST）
- **FR-004**: 寸法は、大きさ 200 で、線の太さ 3、矢じりの長さ 12、矢じりの幅 11、白い縁取りは線と矢じりの外側に片側 1.5 とし、
  大きさに比例させなければならない（MUST）
- **FR-005**: 線の長さ（両端を離した後）が矢じり（両矢印は 2 つ分）より短いときは、矢じりの長さと幅を、入る長さまで同じ割合で縮めなければならない（MUST）
- **FR-006**: 同じ 2 枚の間に行きと帰りの両方があるときは、両端に矢じりの付いた 1 本にまとめなければならない（MUST）。
  まったく同じ矢印が 2 回以上あるときは 1 本だけ描く（MUST）
- **FR-007**: 矢印は、ステッカーと線より後（いちばん上）に、`arrows` に書いた順（まとめたものは先に出た方の位置）で描かなければならない（MUST）
- **FR-008**: 番号は、`rotate` を適用した後の図の上の位置で数えなければならない（MUST）。適用の順は、作り方 → `rotate` → `show` → `stickers` → `arrows`
- **FR-009**: 矢印の色のオプション `arrowColor` を足さなければならない（MUST）。既定は `'#000000'`、色の書き方はほかの色と同じ（1 文字の色コードか `#rrggbb`）。
  白い縁取りの色は `#ffffff` で固定とする
- **FR-010**: 座標は、ほかと同じく小数点以下 2 桁に丸め、どの環境でも同じ SVG の文字列にしなければならない（MUST）
- **FR-011**: `arrows` を省いたとき・空の配列のときは、1.1.0 と 1 バイトも違わない出力にしなければならない（MUST）
- **FR-012**: `stickerColors` は `arrows`・`arrowColor` を受け付けず、`TypeError: Unknown option` にしなければならない（MUST）
- **FR-013**: 誤った `arrows` は、User Story 5 の 4 種のエラーにしなければならない（MUST）。誤った `arrowColor` は、ほかの色と同じエラーにする
- **FR-014**: README（英語）と README.ja.md に `arrows`・`arrowColor` の節と例の図を足さなければならない（MUST）。
  向きの決め方の例として「揃えるには、`from` にあるピースが `to` へ行く（手順を回したときの動きとは逆向き）」を書き、
  `case` の図でそのとおりになる例（H1+ のエッジの 5 点交換）を載せる。例の図はライブラリで作り直せるものにする（原則 VIII）
- **FR-015**: パッケージの版は 1.2.0 とする。CHANGELOG は作らない（変わったことは GitHub の Release の説明に書く）

### Key Entities

- **矢印（arrow）**：`[from, to]` の組。`from`・`to` は図の上のステッカーの位置。向きの意味は使う側が決める
- **両矢印**：同じ 2 枚の行きと帰りをまとめた 1 本

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `arrows` を省いた・空の配列にしたとき、1.1.0 のテスト（410 ケースのサイトとの一致、SVG の正解ファイル）がすべてそのまま通る
- **SC-002**: H1+ の `case` の図で、「今その位置にあるエッジが、揃えると行く位置」へ向かう矢印の組が、README の例
  `[[18, 15], [15, 12], [12, 24], [24, 21], [21, 18]]` と一致する
- **SC-003**: 矢印を含む図の SVG が、Node.js と 3 種のブラウザーで 1 バイトも違わない
- **SC-004**: 誤った入力の例（User Story 5 の各場合、合わせて 15 種以上）がすべて、決めた種類とメッセージのエラーになる
- **SC-005**: 矢印を付けても、図 1 枚を作る時間が今の性能のテストの基準（10ms 未満）のまま

## Assumptions

- 矢印の意味（揃える向きか、手順で動く向きか）はライブラリでは決めない。README に例を書くだけ
- 白い縁取りは、黒い区切りの線の上でも矢印を見分けるため（試作の図で確かめた）。縁取りの色を変える設定は足さない（原則 VII）
- 隣り合うステッカーの間の矢印はまれだが、描けなくはしない
- 公開（Release）は、実装とレビューのあとで、別に指示があってから行う
