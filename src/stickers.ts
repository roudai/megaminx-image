// 設定から 26 色の並びを作る（data-model.md「ステッカーの色の並び」）。
// 作り方：alg（手順を回す）／case（手順の逆を回し、持ち替えの合計を打ち消す）／なし（揃った状態）。
// どれも start の手順を回した状態から始める。
import { DEFAULT_SCHEME, resolveScheme } from './colors.js';
import { STATE_KEYS, checkOptions } from './options.js';
import { applyAlg, solved, topFaces } from './state.js';
import type { Color, ImageOptions, Scheme, StateOptions } from './types.js';

/** 26 枚の色（並び順は README・data-model.md） */
export function stickerColors(options?: StateOptions): Color[] {
  return resolveColors(checkOptions(options, STATE_KEYS));
}

/** 検証済みの設定から 26 色を作る（svg・drawCanvas からも使う） */
export function resolveColors(options: ImageOptions): Color[] {
  const scheme: Scheme = options.scheme === undefined ? DEFAULT_SCHEME : resolveScheme(options.scheme);
  const start = options.start === undefined ? solved() : applyAlg(options.start);

  let state = start;
  if (options.case !== undefined) {
    state = applyAlg(options.case, { inverse: true, cancelRotation: true, state: start });
  } else if (options.alg !== undefined) {
    state = applyAlg(options.alg, { state: start });
  }

  return topFaces(state).map((face) => {
    const color = scheme[face];
    if (color === undefined) throw new TypeError(`No color set for face: ${face}`);
    return color;
  });
}
