# Contract: 公開の API（megaminx-image 1.0.0）

ここに書いたものだけを公開する。名前・引数・戻り値・SVG の形・並び順を変えるのはメジャー版を上げるときだけ（原則 V）。
型は TypeScript で示す。データの中身は `data-model.md`、記法は `notation.md`。

## 共通の型

```ts
type Face = 'U' | 'F' | 'R' | 'BR' | 'BL' | 'L' | 'DR' | 'DBR' | 'B' | 'DBL' | 'DL' | 'D';
type ColorCode = 'd' | 'u' | 'p' | 'c' | 'a' | 'o' | 'l' | 'b' | 'y' | 's' | 'g' | 'r' | 'w' | 'x' | 'z';
type Color = ColorCode | `#${string}`;           // `#rrggbb`
type Scheme = Partial<Record<Face, Color>>;

interface StateOptions {
  alg?: string;                                  // 揃った状態（または start）から手順を回した状態
  case?: string;                                 // 手順で揃うケース（逆を回し、持ち替えの合計を打ち消す）
  state?: readonly Color[];                      // 26 枚を直接指定（並び順は data-model.md）
  start?: string;                                // alg・case の開始の状態を作る手順（state とは一緒に使えない）
  rotate?: number;                               // 向き：できた状態に U を k 回回した向き（整数、既定 0）
  stickers?: Readonly<Record<number, Color>>;    // 番号（0〜25）→ 色 の上書き（回したあとの位置）
  scheme?: Scheme;                               // 既定は DEFAULT_SCHEME（足し合わせず置き換える）
}

interface ImageOptions extends StateOptions {
  size?: number;                                 // 既定 200
  lineColor?: Color;                             // 既定 '#000000'
  background?: Color | null;                     // 既定 null（透明）
}
```

- `alg`・`case`・`state` は 1 つだけ。2 つ以上は `TypeError`。どれも無ければ揃った状態（`start` があればその状態）
- 順は「作り方 → 向き（`rotate`）→ 上書き（`stickers`）」
- 知らない設定の名前（`algorithm` など）は `TypeError: Unknown option: "…"`（打ち間違いを黙って無視しない）

## `megaminx-image`

```ts
function svg(options?: ImageOptions): string;
function stickerColors(options?: StateOptions): Color[];   // 26 個

function canonicalAlg(alg: string): string;
function invertAlg(alg: string): string;
function simplifyAlg(alg: string): string;

const DEFAULT_SCHEME: Readonly<Record<Face, ColorCode>>;
function ollScheme(scheme?: Scheme): Scheme;               // U だけ残し、ほかは 'd'
const COLOR_CODES: Readonly<Record<ColorCode, `#${string}`>>; // 色コード → 16 進

export type { Face, ColorCode, Color, Scheme, StateOptions, ImageOptions };
```

### 例

```js
import { svg } from 'megaminx-image';
const image = svg({ case: "R U R' U R U2' R'", size: 300 });

import { PLL_CASES } from 'megaminx-image/cases';
const turned = svg({ case: PLL_CASES[0].alg, rotate: 2 });   // U を 2 回回した向き
```

### SVG の形（固定）

- 1 行目から次の順。改行は入れない。数値は小数第 2 位までに丸め、末尾の 0 は書かない

```text
<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">
[<rect width="{S}" height="{S}" fill="{背景}"/>]                         ← 背景を指定したときだけ
<g stroke="{線}" stroke-width="{細}" stroke-linejoin="miter" stroke-miterlimit="10">
  <polygon points="x,y x,y …" fill="#rrggbb"/> × 26                      ← サイトの描く順
</g>
<g fill="none" stroke="{線}" stroke-width="{太}" stroke-linejoin="miter" stroke-miterlimit="10">
  <polygon points="…"/>                                                  ← U 面の外周
  <polygon points="…"/>                                                  ← 側面の外周
  <path d="M x y L x y M … "/>                                           ← 側面の区切り 5 本
</g>
</svg>
```

（上は読みやすさのために改行と字下げを入れている。実際の出力には入らない）

## `megaminx-image/canvas`

```ts
interface CanvasLike {
  width: number;
  height: number;
  getContext(contextId: '2d'): unknown;
}
function drawCanvas(canvas: CanvasLike, options?: ImageOptions): void;

export type { CanvasLike, Canvas2DContextLike, ImageOptions };
```

- `HTMLCanvasElement`・`OffscreenCanvas` をそのまま渡せる。引数の型をブラウザの型（DOM）に頼らない形にしたのは、
  DOM の型を入れていない Node.js のプロジェクトでも型の確認が通るようにするため
- `Canvas2DContextLike` は、描くのに使う 2D の context の部分（`fillStyle`・`strokeStyle`・`lineWidth`・
  `lineJoin`・`lineCap`・`miterLimit`・`clearRect`・`fillRect`・`beginPath`・`moveTo`・`lineTo`・`closePath`・
  `fill`・`stroke`）。`getContext('2d')` が `null` を返せば `Error: Canvas 2D context is not available`
- canvas の幅・高さを `size` にして描く（整数でない `size` は canvas の側で整数に切り捨てられる）。
  SVG と同じ点・順・太さ・角の形（miter、miterLimit 10、lineCap butt）

## `megaminx-image/png`

```ts
function png(options?: ImageOptions): Promise<Uint8Array>;
```

- `svg(options)` を `@resvg/resvg-js`（任意の依存）で PNG にする。入っていなければ
  `Error: Install "@resvg/resvg-js" to export PNG (npm install @resvg/resvg-js)`
- ファイルに書くとき：`fs.writeFileSync('a.png', await png({ case: '…' }))`

## `megaminx-image/cases`

```ts
interface CaseEntry {
  readonly name: string;
  readonly group: string;
  readonly alg: string;    // ケースを揃える手順 → { case: alg }
  readonly setup: string;  // ケースになる手順   → { alg: setup }
}
const PLL_CASES: readonly CaseEntry[];   // 151 件
const OLL_CASES: readonly CaseEntry[];   // 259 件
```

## エラー（`research.md` R10）

| 場面 | 型 | メッセージの例 |
|---|---|---|
| 知らない記号 | `SyntaxError` | `Invalid move: "Q" (at position 5)` |
| 回数だけの記号（`R 2`） | `SyntaxError` | `Invalid move: "2" (at position 2)` |
| 閉じていない括弧 | `SyntaxError` | `Missing closing parenthesis (opened at position 0)` |
| 対応しない `)` | `SyntaxError` | `Unmatched ")" (at position 7)` |
| 知らない色 | `TypeError` | `Unknown color: "orange"` |
| 知らない面（配色） | `TypeError` | `Unknown face: "FR"` |
| 配色に無い面 | `TypeError` | `No color set for face: DR` |
| 作り方が 2 つ以上 | `TypeError` | `Use only one of "alg", "case" and "state"` |
| `start` と `state` | `TypeError` | `"start" cannot be used with "state"` |
| 知らない設定 | `TypeError` | `Unknown option: "algorithm"` |
| `state` の数 | `RangeError` | `"state" must have 26 colors (got 25)` |
| 上書きの番号 | `RangeError` | `Sticker index out of range: 26 (expected 0-25)` |
| 向き | `RangeError` | `"rotate" must be an integer (got 0.5)` |
| 大きさ | `RangeError` | `"size" must be a positive finite number (got 0)` |

- 読める・読めないの範囲はサイトと同じ（`notation.md`）。メッセージの前半（位置の前まで）はサイトの文と同じ
