// 設定から 26 色の並びを作る（data-model.md「ステッカーの色の並び」「画像の向き」）。
// 順：作り方（alg・case・state）→ 向き（rotate）→ 上書き（stickers）。
//   alg：start（既定は揃った状態）から手順を回す
//   case：start から手順の逆を回し、持ち替えの合計を打ち消す（サイトの case と同じ）
//   state：26 色をそのまま使う
import { DEFAULT_SCHEME, normalizeColor, resolveScheme } from './colors.js';
import { STATE_KEYS, checkOptions, show } from './options.js';
import { applyAlg, solved, topFaces } from './state.js';
import type { Color, ImageOptions, Scheme, StateOptions } from './types.js';

const COUNT = 26;

/** 26 枚の色（並び順は README・data-model.md） */
export function stickerColors(options?: StateOptions): Color[] {
  return resolveColors(checkOptions(options, STATE_KEYS));
}

/** 検証済みの設定から 26 色を作る（svg・drawCanvas からも使う） */
export function resolveColors(options: ImageOptions): Color[] {
  let colors = options.state !== undefined ? directState(options.state) : fromAlg(options);
  if (options.rotate !== undefined) colors = rotateColors(colors, checkRotate(options.rotate));
  if (options.stickers !== undefined) colors = override(colors, options.stickers);
  return colors;
}

function fromAlg(options: ImageOptions): Color[] {
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

function directState(state: unknown): Color[] {
  if (!Array.isArray(state)) throw new TypeError(`"state" must be an array of ${COUNT} colors (got ${show(state)})`);
  if (state.length !== COUNT) throw new RangeError(`"state" must have ${COUNT} colors (got ${state.length})`);
  return state.map((c) => normalizeColor(c));
}

function checkRotate(rotate: unknown): number {
  if (typeof rotate !== 'number' || !Number.isInteger(rotate)) {
    throw new RangeError(`"rotate" must be an integer (got ${show(rotate)})`);
  }
  return ((rotate % 5) + 5) % 5;
}

/**
 * U を k 回回した向きに付け替える。U を 1 回回すと、頂点 k の位置に頂点 k+1 にあった色が来る
 * （辺・側面も同じ。番号 0 は動かない）。「手順に U を足した結果」と同じことをテストで確かめている
 */
function rotateColors(colors: readonly Color[], k: number): Color[] {
  if (k === 0) return colors.slice();
  return colors.map((_, i) => {
    if (i === 0) return colors[0];
    if (i <= 10) {
      const v = Math.floor((i - 1) / 2); // 頂点・辺の番号
      return colors[i + 2 * (((v + k) % 5) - v)];
    }
    const e = Math.floor((i - 11) / 3); // 側面の辺の番号
    return colors[i + 3 * (((e + k) % 5) - e)];
  });
}

function override(colors: readonly Color[], stickers: unknown): Color[] {
  if (stickers === null || typeof stickers !== 'object') {
    throw new TypeError(`"stickers" must be an object (got ${show(stickers)})`);
  }
  const out = colors.slice();
  for (const [key, color] of Object.entries(stickers)) {
    const index = Number(key);
    if (key.trim() === '' || !Number.isInteger(index) || index < 0 || index >= COUNT) {
      throw new RangeError(`Sticker index out of range: ${key} (expected 0-${COUNT - 1})`);
    }
    out[index] = normalizeColor(color);
  }
  return out;
}
