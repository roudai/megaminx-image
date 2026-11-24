// 色と配色（data-model.md）
import type { Color, ColorCode, Face, Scheme } from './types.js';

export const FACES: readonly Face[] = Object.freeze(['U', 'F', 'R', 'BR', 'BL', 'L', 'DR', 'DBR', 'B', 'DBL', 'DL', 'D']);

/** 色コード → 16 進（サイトの js/alg-input.js の CODE_HEX と、x 黒） */
export const COLOR_CODES: Readonly<Record<ColorCode, `#${string}`>> = Object.freeze({
  d: '#696969',
  u: '#d3d3d3',
  p: '#ffc0cb',
  c: '#fffacd',
  a: '#00ffff',
  o: '#ffa500',
  l: '#7cfc00',
  b: '#1e90ff',
  y: '#ffff00',
  s: '#9400d3',
  g: '#2e8b57',
  r: '#ff0000',
  w: '#ffffff',
  x: '#000000',
  z: '#1b1b1b',
});

/** 既定の配色（サイトと同じ） */
export const DEFAULT_SCHEME: Readonly<Record<Face, ColorCode>> = Object.freeze({
  U: 'u',
  F: 'a',
  R: 'o',
  BR: 'l',
  BL: 'p',
  L: 'c',
  DR: 's',
  DBR: 'y',
  B: 'b',
  DBL: 'r',
  DL: 'g',
  D: 'w',
});

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isColor(value: unknown): value is Color {
  return typeof value === 'string' && (Object.prototype.hasOwnProperty.call(COLOR_CODES, value) || HEX_RE.test(value));
}

/** 色を検証する。色でなければ TypeError（label は今は使わないが、呼び出し側の目印） */
export function assertColor(value: unknown, _label: string): asserts value is Color {
  if (!isColor(value)) throw new TypeError(`Unknown color: ${JSON.stringify(value)}`);
}

/** 検証して、16 進は小文字にそろえる */
export function normalizeColor(value: unknown): Color {
  assertColor(value, 'color');
  return (value[0] === '#' ? value.toLowerCase() : value) as Color;
}

/** 色 → 16 進（小文字） */
export function toHex(color: Color): `#${string}` {
  return color[0] === '#' ? (color.toLowerCase() as `#${string}`) : COLOR_CODES[color as ColorCode];
}

/** 配色を検証して、色をそろえた新しい配色を返す */
export function resolveScheme(scheme: unknown): Scheme {
  if (scheme === null || typeof scheme !== 'object' || Array.isArray(scheme)) {
    throw new TypeError(`"scheme" must be an object (got ${JSON.stringify(scheme)})`);
  }
  const out: Scheme = {};
  for (const [face, color] of Object.entries(scheme)) {
    if (!(FACES as readonly string[]).includes(face)) throw new TypeError(`Unknown face: ${JSON.stringify(face)}`);
    out[face as Face] = normalizeColor(color);
  }
  return out;
}

/** OLL 用の配色：U は渡した配色（既定は DEFAULT_SCHEME）の U の色、ほかの 11 面は 'd'（暗い灰色） */
export function ollScheme(scheme?: Scheme): Scheme {
  const base = scheme === undefined ? DEFAULT_SCHEME : resolveScheme(scheme);
  if (base.U === undefined) throw new TypeError('No color set for face: U');
  const out: Scheme = {};
  for (const face of FACES) out[face] = face === 'U' ? base.U : 'd';
  return out;
}
