# Feature Specification: 色を残すステッカーの指定（show）

**Feature Branch**: `002-show-option`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "megaminx-image に新しいオプション show を足す。例の部分のステッカーだけに色を残し、ほかの側面を灰色にした図を、ライブラリの機能として作れるようにする"

## 背景

roudai.net の Megaminx PLL のページ（基礎知識の、ペア・偽ペア・バー・偽バー・ブロック・偽ブロック・ヘッドライトの説明）では、
例の部分のステッカーだけに色を残し、ほかを灰色にした図を使っている。今はサイトの側で、`stickers` に
「残りの側面を濃い灰色にする上書き」を作って渡している。同じことを、色を残すステッカーの番号を並べるだけでできるようにする。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 指定したステッカーだけ色を残す（Priority: P1）

PLL の説明の図を作る人が、ケースの手順と、色を残したい側面のステッカーの番号を渡す。
番号に無い側面のステッカーは濃い灰色になり、上面はそのまま色が付いた図ができる。

**Why this priority**: この機能の目的そのもの。これだけで、サイトの側の上書きを作る処理が要らなくなる。

**Independent Test**: `show` に番号を渡した図と、同じ指定に「番号に無い側面を 'd' にする `stickers`」を付けた図が、
同じ 26 色・同じ SVG になることで確かめられる。

**Acceptance Scenarios**:

1. **Given** 揃った状態、**When** `show: [17, 18, 19]` で色を取り出す、**Then** 17〜19 は F 面の色のまま、
   ほかの側面（11〜16・20〜25）は 'd'、上面（0〜10）は U の色のまま
2. **Given** ケースの手順、**When** `show: []` で図を作る、**Then** 側面の 15 枚がすべて 'd'、上面は手順どおりの色
3. **Given** ケースの手順、**When** `show` に上面の番号（例：0・5）や同じ番号を 2 回入れる、**Then** エラーにならず、
   上面の番号は何も変えず、重なった番号は 1 回と同じ結果になる
4. **Given** 任意の指定、**When** `show` を指定しない（または `undefined`）、**Then** 26 色も SVG も 1.0.0 と 1 バイトも変わらない

---

### User Story 2 - 向き・上書きと組み合わせる（Priority: P1）

ケースを別の向きで見せながら、例の部分だけ色を残す。さらに、灰色にしたところの一部だけ別の色にする。

**Why this priority**: サイトの使い方（`rotate: 2` と一緒に使う）がこれ。順番が決まっていないと、番号の意味が変わってしまう。

**Independent Test**: `rotate` と `show` を一緒に渡した結果が、「`rotate` だけで作った 26 色に対して、`show` の番号に無い
側面を 'd' にしたもの」と同じになることで確かめられる。

**Acceptance Scenarios**:

1. **Given** ケースの手順、**When** `rotate: 2, show: [18, 19, 20, 21]`、**Then** 番号は向きを変えた**後**の位置を指し、
   18〜21 だけが向きを変えた後の色のまま残る
2. **Given** 任意の指定、**When** `show: [17]` と `stickers: { 11: 'r' }` を一緒に渡す、**Then** 11 は 'r'
   （`stickers` は `show` の後に効くので、灰色にしたところも色を変えられる）
3. **Given** `state` で 26 色を直接指定、**When** `show` を一緒に渡す、**Then** `alg`・`case` と同じように灰色にする

---

### User Story 3 - 誤った指定をエラーにする（Priority: P2）

番号の打ち間違いや型の間違いを、それらしく見える図にせずにエラーで知らせる。

**Why this priority**: 原則 VI（間違いはエラーにする）。ただ、正しい指定の図が作れることの方が先。

**Independent Test**: 誤った `show` を渡すと、決めた種類とメッセージのエラーになることで確かめられる。

**Acceptance Scenarios**:

1. **Given** 任意の指定、**When** `show` が配列でない（例：`18`、`'18'`、`{}`、`null`）、**Then**
   `TypeError: "show" must be an array of sticker indices (got …)`
2. **Given** 任意の指定、**When** `show` の要素が 0〜25 の整数でない（例：`26`、`-1`、`1.5`、`NaN`、`'18'`）、**Then**
   `RangeError: Sticker index out of range: … (expected 0-25)`

---

### Edge Cases

- `show` に上面の番号（0〜10）があるとき：受け付けて、何もしない（上面はもともと灰色にしない）
- 同じ番号が 2 回以上あるとき：受け付ける。1 回と同じ結果
- `show: []`：側面の 15 枚をすべて灰色にする
- `show` に 11〜25 をすべて並べたとき：何も灰色にしない（`show` を指定しないときと同じ 26 色）
- 灰色にする面の色が配色（`scheme`）に無いとき：今と同じく `TypeError: No color set for face: …`
  （色を決めてから灰色にするため。灰色にする面の色も要る）
- `show` が `undefined`：指定しないのと同じ（ほかのオプションと同じ扱い）
- 配列でないもの・範囲の外の番号は、ほかの誤り（例：`case` と `state` を一緒に）より先か後かは決めない。どれか 1 つのエラーになればよい

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 色を決める設定に、新しいオプション `show`（ステッカーの番号の配列）を足さなければならない（MUST）。
  番号は README の「Sticker order」の番号（0〜25）と同じ
- **FR-002**: `show` を指定したとき、側面の上段（11〜25）のうち `show` に無い番号のステッカーを、濃い灰色 'd'（#696969）に
  しなければならない（MUST）。上面（0〜10）は灰色にしてはならない（MUST NOT）
- **FR-003**: 灰色は 'd' で固定とする。灰色の色を変える設定は足さない（ほかの色にしたいときは `stickers` で上書きする）
- **FR-004**: 色を決める順は「作り方（`alg`・`case`・`state`）→ 向き（`rotate`）→ `show` → 上書き（`stickers`）」と
  しなければならない（MUST）。`show` の番号は向きを変えた後の位置を指す
- **FR-005**: `show` は、色だけを返す関数・SVG・canvas・PNG のすべてで使えなければならない（MUST）
- **FR-006**: `show` が配列でなければ `TypeError: "show" must be an array of sticker indices (got <値>)` を投げなければならない（MUST）。
  `<値>` はほかのエラーと同じ書き方
- **FR-007**: `show` の要素が 0〜25 の整数（数値）でなければ、`stickers` と同じ
  `RangeError: Sticker index out of range: <値> (expected 0-25)` を投げなければならない（MUST）。文字列の `'18'` も誤りとする
- **FR-008**: `show` の上面の番号（0〜10）と、重なった番号は受け付け、エラーにしてはならない（MUST NOT）
- **FR-009**: `show` を指定しないときの出力（26 色・SVG の文字列・canvas への描き方・PNG）は、1.0.0 と 1 バイトも
  変えてはならない（MUST NOT）。テストの正解ファイル（`test/svg/`）は変わらない
- **FR-010**: README（英語）と README.ja.md に、`show` の説明と例を足さなければならない（MUST）。例の図はライブラリで
  作り直せるものにする（原則 VIII）
- **FR-011**: パッケージの版は 1.1.0 とする（互換のある機能の追加。docs/releasing.md の表）

### Key Entities

- **show**：色を残すステッカーの番号の並び。順番と重なりに意味は無い（番号の集まりとして扱う）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: サイトの今の使い方（`stickers` で残りの側面を 'd' にする上書き）を `show` に置き換えても、PLL の全 151 ケースで、
  いくつかの `show`・`rotate` の組み合わせについて、26 色が置き換える前と同じになる
- **SC-002**: `show` を指定しないとき、1.0.0 のテスト（PLL・OLL の 410 ケースのサイトとの一致、SVG の正解ファイル）が
  すべてそのまま通る
- **SC-003**: 誤った `show` の入力の例（配列でないもの 4 種以上、範囲の外の要素 5 種以上）がすべて、決めた種類とメッセージのエラーになる
- **SC-004**: 図 1 枚を作る時間が、`show` を付けても目に見えて遅くならない（今の性能のテストの基準のまま通る）

## Assumptions

- 灰色にするのは側面の上段だけで足りる。PLL の図では上面は 1 色なので、側面の番号だけを書けばよい
- 灰色の色を変えたい人は少なく、`stickers` で足りる（原則 VII）
- `show` を指定しない人には何も変わらないので、1.1.0（マイナー）で出せる
- 公開（Release）は、実装とレビューのあとで、別に指示があってから行う
