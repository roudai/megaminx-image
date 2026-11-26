// 公開する型（contracts/api.md）

/** メガミンクスの 12 面 */
export type Face = 'U' | 'F' | 'R' | 'BR' | 'BL' | 'L' | 'DR' | 'DBR' | 'B' | 'DBL' | 'DL' | 'D';

/** 1 文字の色コード（サイトと同じ 15 個） */
export type ColorCode = 'd' | 'u' | 'p' | 'c' | 'a' | 'o' | 'l' | 'b' | 'y' | 's' | 'g' | 'r' | 'w' | 'x' | 'z';

/** 色：1 文字の色コードか `#rrggbb` */
export type Color = ColorCode | `#${string}`;

/** 配色：面 → 色。一部の面だけでもよい（使う面が無ければエラー） */
export type Scheme = Partial<Record<Face, Color>>;

/** 26 枚の色を決める設定 */
export interface StateOptions {
  /** 揃った状態（または start）から手順を回した状態 */
  alg?: string;
  /** 手順で揃うケース（手順の逆を回し、持ち替えの合計を打ち消す） */
  case?: string;
  /** 26 枚を直接指定（並び順は README） */
  state?: readonly Color[];
  /** alg・case の開始の状態を作る手順（state とは一緒に使えない） */
  start?: string;
  /** 向き：できた状態に U を k 回回した向き（整数、既定 0） */
  rotate?: number;
  /**
   * 色を残すステッカーの番号（0〜25、回したあとの位置）。側面の上段（11〜25）のうち、ここに無いものを 'd' にする。
   * 上面（0〜10）は変えない。stickers はこの後に効く
   */
  show?: readonly number[];
  /** 番号（0〜25）→ 色 の上書き（回したあとの位置） */
  stickers?: Readonly<Record<number, Color>>;
  /** 配色（既定は DEFAULT_SCHEME。足し合わせず置き換える） */
  scheme?: Scheme;
}

/** 画像を作る設定 */
export interface ImageOptions extends StateOptions {
  /** 画像の大きさ（正方形の 1 辺）。既定 200 */
  size?: number;
  /** 線の色。既定 '#000000' */
  lineColor?: Color;
  /** 背景の色。既定 null（透明） */
  background?: Color | null;
  /**
   * ステッカーからステッカーへの矢印 [from, to] の並び（番号は rotate の後の図の上の位置）。
   * [a, b] と [b, a] は 1 本の両矢印にまとめる。ステッカーと線の上に、白い縁取り付きで描く
   */
  arrows?: readonly (readonly [number, number])[];
  /** 矢印の色。既定 '#000000'（白い縁取りは固定） */
  arrowColor?: Color;
}
