# Research: メガミンクスの最後の層の画像ライブラリ（megaminx-image）

計画を立てるために調べて決めたこと。元にしたのは既存のサイトのリポジトリ
`MegaminxImageEditor`（手元の `/Users/roudainet/GitHub/roudainet/MegaminxImageEditor`、以下「サイト」）。

## サイトの調査結果（前提）

- 状態計算は `js/megaminx-state.js`（400 行、DOM 非依存、UMD で node からも `require` できる）
  - 132 枚のステッカーを 3 次元の位置で持ち、面ごとの 72° 回転を位置の置換として読み込み時に作る
  - `parseAlg`・`canonicalAlg`・`simplifyAlg`・`invertMoves`・`applyAlg(alg, { inverse, cancelRotation, state })`・
    `topView`・`toImageColors(state, scheme)`・`ollMask(scheme, gray)`・`DEFAULT_SCHEME` がある
  - エラーは `SyntaxError`：`Invalid move: "…"`・`Missing closing parenthesis`・`Unmatched ")"`。
    配色に無い面は `Error('No color set for face: X')`
  - 空の括弧 `()` はエラーにならず、何もしない手順として読む
- 描画は `js/megaminx-draw.js`（canvas だけ。SVG は無い）。座標は `geometry(size)`、ステッカーの多角形は
  `stickers(size)`。最後に `window.MegaminxDraw` に入れるので、node で読むには `window` を用意する必要がある
  - 細い線 `size / 100`、太い線 `size / 50`。線の色の既定は `#000000`、背景の既定は透明。大きさの既定は 200
  - 色コードの表示色は CSS の色の名前（`dimgray` など）。同じ値の 16 進は `js/alg-input.js` の `CODE_HEX`
    （`x` 黒は `#000000`）
- サイトの画面での作り方（`js/alg-input.js` の `update`）
  - alg：`applyAlg(手順)`（持ち替えは打ち消さない）
  - case：`applyAlg(手順, { inverse: true, cancelRotation: true })`
  - OLL 用の配色：`ollMask({ U: U の色 }, 暗い灰色)`
- ケースのデータは `js/pll-data.js`（151 件）・`js/oll-data.js`（259 件）。どちらも生成物で、
  `{ name, group, alg（揃える手順）, setup（そのケースになる手順）, … }` の配列。合わせて 410 件
- テストは `node --test test/`（`test/megaminx-state.test.js` など）

## R1. 言語・配布の形

- **Decision**: TypeScript で書き、ES モジュールだけを配布する（`"type": "module"`、`exports` で入口を分ける）。
  対象は Node.js 22.12 以上と、ES2020 が動くブラウザ。型定義（`.d.ts`）は `tsc` で出す
- **Rationale**: 型定義が要る（原則 II）。Node.js 22.12 以上は CommonJS から `require()` で ES モジュールを
  読めるので、CommonJS 版を別に作らなくても両方から使える。作る物が 1 種類なら、出力の食い違いも起きない
- **変更（2026-11-24、実装の前）**: 計画では 20.19 以上としたが、Node.js 20 は 2026 年 4 月でサポートが終わり、
  Vitest 5 は 22.12 以上でしか動かないため、22.12 以上に上げた（依頼者の判断）。CI は 22 と 24 で回す
- **Alternatives considered**: ES モジュールと CommonJS の両方を出す（ビルドと確認が倍になる。古い Node は
  サポートが切れている）／JavaScript ＋ 手書きの `.d.ts`（型と実装がずれやすい）

## R2. 入口の分け方

- **Decision**: 4 つの入口に分ける
  - `megaminx-image`：SVG・色の並び・手順の道具・配色（Node.js とブラウザの共通部分）
  - `megaminx-image/canvas`：canvas に描く（ブラウザ用の薄い層）
  - `megaminx-image/png`：PNG のバイト列（Node.js 用。任意の依存を使う）
  - `megaminx-image/cases`：PLL・OLL のケースのデータ
- **Rationale**: canvas はブラウザ用の層として分ける（原則 II）。PNG だけが任意の依存を使うので、本体の読み込みで
  その依存を探しに行かないようにする。ケースのデータは画像を作るだけの人に読ませない（clarify の決定）
- **Alternatives considered**: すべて本体から出す（PNG の依存の扱いが複雑になり、ケースのデータも常に読まれる）

## R3. サイトのロジックの移し方

- **Decision**: `megaminx-state.js` の状態計算（132 枚の位置・回転の置換・手順の読み方・逆・打ち消し・
  まとめ・上面の取り出し）を、同じ手順のまま TypeScript に書き写す。描画は `megaminx-draw.js` の
  `geometry`・`stickers` の形を書き写し、SVG と canvas の両方で使う
- **Rationale**: サイトと同じ結果が最優先（原則 I）。作り直すより、同じ計算を写して正解データで確かめるほうが
  食い違いが入りにくい
- **Alternatives considered**: 置換を表として直接持つ（速いが、サイトのコードとの対応が見えにくくなる。
  必要になったら後で変えられる）

## R4. 正解データの書き出し

- **Decision**: 開発用のスクリプト `scripts/export-from-site.mjs` で、サイトのコードを直接読み込んで
  正解データを書き出し、このリポジトリに保存する（`test/golden/`）。サイトの場所は環境変数
  `SITE_REPO`（既定は `../MegaminxImageEditor`）。書き出したときのサイトのコミットも記録する
  - `cases.json`：410 件それぞれについて、case（`alg` を case で）と alg（`setup` を alg で）の 26 色。
    既定の配色で求める。OLL は OLL 用の配色の 26 色も持つ
  - `notation.json`：記法の境目の手順の一覧と、サイトでの結果（読めたら回したあとの 26 色、
    読めなければエラーのメッセージ）。`canonicalAlg`・`simplifyAlg` の結果も持つ
  - `geometry.json`：大きさ 200 のときの 26 枚の多角形の頂点（`window` を用意して `megaminx-draw.js` を読む）
  - 同じスクリプトで `src/cases/pll.ts`・`src/cases/oll.ts`（`name`・`group`・`alg`・`setup`）も作る
- **Rationale**: 原則 I・III。サイトのリポジトリが無い環境（CI・ほかの開発者）でもテストできるよう、
  書き出した結果を保存しておく。書き出し直せば、サイトが変わったときに差が分かる
- **Alternatives considered**: テストのたびにサイトのコードを読む（サイトのリポジトリが無いと動かない）／
  サイトをこのリポジトリにサブモジュールで入れる（画面などの不要なものまで入る）

## R5. 座標の求め方と丸め方（同じ入力なら同じ出力）

- **Decision**:
  - 大きさ 1 のときの座標（三角関数の値）を、生成スクリプトで 17 桁の数値の表として作り、ソースに書いておく。
    実行時には三角関数を使わず、表に大きさを掛けるだけにする。表と計算式が合っていることはテストで確かめる
  - SVG に書く数値は、小数第 2 位までに丸める（`Math.round(v * 100) / 100`）。数値を文字列にするのは
    JavaScript の標準の変換（`String(n)`。末尾の 0 は付かない）
  - 線の太さも同じ丸め方（大きさ 200 で 2・4）
- **Rationale**: `Math.sin`・`Math.cos` の値は ECMAScript の仕様で近似として許されていて、ブラウザや
  Node.js のバージョンで最後の桁が違うことがある。足し算・掛け算と `Math.round`・`String(n)` は仕様で結果が
  決まっているので、表を使えば環境が変わっても同じ文字列になる（原則 IV）。小数第 2 位は、1000px の画像でも
  0.01px で見た目に差が出ない
- **Alternatives considered**: 実行時に三角関数で求めて丸める（丸めの境目で 1 桁ずれることがある）／
  整数に丸める（小さい画像で形が崩れる）

## R6. SVG の形

- **Decision**: 次の順で書く。属性の順と空白は固定する
  1. `<svg xmlns="http://www.w3.org/2000/svg" width="S" height="S" viewBox="0 0 S S">`
  2. 背景を指定したときだけ、全面の `<rect>`
  3. 26 枚のステッカー：サイトの描く順に `<polygon points="…" fill="#rrggbb"/>`。線は親の `<g>` に
     まとめる（`stroke`・`stroke-width`（細い線）・`stroke-linejoin="miter"`・`stroke-miterlimit="10"`）
  4. 太い線：U 面の外周と側面の外周の `<polygon fill="none">`、側面の区切り 5 本の `<path>`
  - 色はすべて小文字の `#rrggbb` で書く（色コードは R6 の表で 16 進にする）
- **Rationale**: サイトの canvas と同じ順・同じ太さで描けば、同じ見た目になる。canvas の角の既定
  （miter、miterLimit 10）と SVG の既定（miterlimit 4）が違うので、明示して合わせる。色を 16 進にしておけば、
  色の名前を知らない描画の道具（PNG に変換するものなど）でも同じ色になる
- **Alternatives considered**: CSS の色の名前で書く（サイトと同じ書き方だが、道具によって対応が違う）

## R7. PNG の書き出し

- **Decision**: `megaminx-image/png` の `png(options)` が、SVG を作って任意の依存 `@resvg/resvg-js` で
  PNG に変換し、バイト列（`Uint8Array`）を返す。`@resvg/resvg-js` は `peerDependencies` に書き、
  `peerDependenciesMeta` で任意にする。入っていなければ、入れ方を書いたエラー
  （`Install "@resvg/resvg-js" to export PNG`）にする。ファイルへの書き出しは、README に
  `fs.writeFileSync(path, await png(...))` の 1 行で示す
- **Rationale**: 必須の依存を持たない（原則 II）。resvg は SVG を正確に描く Rust 製の道具で、主な環境向けに
  作り済みの物が配られ、ネイティブのビルドが要らない。ファイルに書くだけの関数は、Node.js の 1 行で済むので
  公開しない（原則 V・VII）
- **Alternatives considered**: `canvas`（node-canvas。ネイティブのビルドが要り、入れるのが重い）／
  `sharp`（大きい。SVG の描き方が resvg と少し違う）／PNG を自前で描く（作る量が多すぎる。原則 VII）

## R8. canvas への描画

- **Decision**: `megaminx-image/canvas` の `drawCanvas(canvas, options)`。canvas の幅・高さを `size` にし、
  SVG と同じ座標・順・太さで描く。渡された canvas の `getContext('2d')` だけを使い、`document` などの
  グローバルには触れない（`OffscreenCanvas` でも動く）
- **Rationale**: サイトの `draw` と同じ描き方。座標は SVG と同じ部品から取るので、見た目がずれない
- **Alternatives considered**: SVG を画像として canvas に読み込む（非同期になり、手間が増える）

## R9. 入力の形

- **Decision**: 1 つの設定のオブジェクトで渡す（`svg({ case: "R U R' U'", size: 300 })`）
  - 作り方は `alg`・`case`・`state` のどれか 1 つ（2 つ以上はエラー。どれも無ければ揃った状態）
  - 開始の状態は `start` に手順の文字列で渡す（揃った状態から `start` を回した状態から始める）。
    132 枚の内部の状態は公開しない
  - 上書きは `stickers: { 0: 'r', 12: '#123456' }`（並び順の番号 → 色）
  - 配色 `scheme` は既定の配色を置き換える（足し合わせない）。使う面が無ければエラー（サイトと同じ）
- **Rationale**: 「5 行ほどで SVG を作れる」（SC-001）。開始の状態を手順で受ければ、内部の 132 枚の並びを
  公開の約束にしなくて済む（原則 V。あとで全体の展開図を足すときも内部を変えられる）
- **Alternatives considered**: 作り方ごとに関数を分ける（`svgFromAlg` など。関数が増える）／
  開始の状態を 132 枚の配列で受ける（内部の並びが公開の約束になる）

## R10. エラーの形

- **Decision**:
  - 手順が読めない：`SyntaxError`。メッセージはサイトの文に、位置を足す
    （例：`Invalid move: "Q" (at position 5)`・`Missing closing parenthesis (opened at position 0)`・
    `Unmatched ")" (at position 7)`）。位置は 0 から数えた、元の文字列の中の位置
  - 色・配色・番号・大きさの間違い：`TypeError`（形が違う）か `RangeError`（範囲の外）。
    メッセージに、どの指定が悪いかを書く（例：`No color set for face: DR`・`Unknown color: "orange"`）
  - 独自のエラーの型は作らない
- **Rationale**: 原則 VI。読める・読めないはサイトと同じにし、メッセージは位置を足して分かりやすくする
  （エラーになることとその種類が同じなら、原則 I の「読み方が同じ」は守れる）。標準のエラーの型で足りるので、
  公開するものを増やさない（原則 V）
- **Alternatives considered**: `MegaminxImageError` などの独自の型（公開の API が増える）

## R11. テストの道具

- **Decision**: Vitest で Node.js のテストを書く。ブラウザで同じ SVG になることは、Playwright で
  Chromium・Firefox・WebKit に同じ入力を渡して文字列を比べる（`npm run test:browser`）。
  1 枚 10ms 未満は Vitest のテストで測る（読み込み直後の 1 回を除いた 1,000 枚の平均）
- **Rationale**: TypeScript をそのまま実行でき、設定が少ない。ブラウザでの一致（SC-006）は実際のブラウザで
  確かめる必要がある
- **Alternatives considered**: `node --test`（サイトと同じだが、TypeScript を実行する設定が要る）／
  jsdom（実際のブラウザの数値の計算とは違う）

## R12. README の画像の例

- **Decision**: `scripts/build-readme-images.mjs` が、ビルドしたライブラリで `docs/images/*.svg` を作る。
  README からはその SVG を参照する。テストで「作り直した結果が保存してあるファイルと同じ」ことを確かめる
- **Rationale**: 原則 VIII。手で作った画像を置かず、ライブラリが変わったら例も変わったことが分かる
- **Alternatives considered**: PNG にする（PNG の依存が開発に要る。GitHub・npm は SVG を表示できる）

## R14. 画像の向き（`rotate`）

- **Decision**: 設定 `rotate`（整数、5 で割った余り、既定 0）。できた 26 色の並びを、U を k 回回したときの
  位置に付け替える。順は「作り方（alg・case・state）→ 向き → 上書き（`stickers`）」
- **Rationale**: 写る 26 枚はどれも最後の層なので、U を回すのは並びの付け替えだけで済み、状態計算に手を入れない
  （既定 0 ならサイトと同じ。原則 I）。手順の文字列に U を足す方法は、case と alg で向きが逆になり、state では
  使えない。上書きは見えている位置の番号で効くほうが分かりやすい
- **Alternatives considered**: 足さずに文字列をつなぐ方法を README に書く／`auf: "U2'"` のように記号で受ける
  （記号の読み方の約束がもう 1 つ増える）
- **確かめ方**：`{ alg: A, rotate: k }` が `{ alg: A + " U" × k }` と同じ 26 色になる（ランダムな手順と 410 件）。
  `case`・`state` でも、向き 0 の結果を付け替えたものと同じになる

## R13. 最初の版

- **Decision**: 最初の公開は `1.0.0`。`contracts/` に書いた API・SVG の形・並び順を、1.0.0 の約束とする
- **Rationale**: 原則 V。0.x のあいだは小さな版でも互換を壊せる慣習があり、約束がはっきりしない
- **Alternatives considered**: `0.1.0` から始める（約束が固まるまで試せるが、原則 V の書き方と合わない）
