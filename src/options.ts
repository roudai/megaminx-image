// 設定の検証（contracts/api.md のエラーの表・原則 VI）
import type { ImageOptions } from './types.js';

export const STATE_KEYS = ['alg', 'case', 'state', 'start', 'rotate', 'stickers', 'scheme'] as const;
export const IMAGE_KEYS = [...STATE_KEYS, 'size', 'lineColor', 'background'] as const;

/** エラーのメッセージに入れる値の書き方（NaN・Infinity も読めるように） */
export function show(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'bigint' || value === undefined) return String(value);
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * 設定を検証し、値が undefined の項目を除いた写しを返す。
 * allowed にない名前はエラー（打ち間違いを黙って無視しない）
 */
export function checkOptions(options: unknown, allowed: readonly string[]): ImageOptions {
  if (options === undefined) return {};
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError(`Options must be an object (got ${show(options)})`);
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!allowed.includes(key)) throw new TypeError(`Unknown option: ${JSON.stringify(key)}`);
    if (value !== undefined) out[key] = value;
  }
  for (const key of ['alg', 'case', 'start'] as const) {
    if (key in out && typeof out[key] !== 'string') {
      throw new TypeError(`"${key}" must be a string (got ${show(out[key])})`);
    }
  }
  const modes = ['alg', 'case', 'state'].filter((k) => k in out);
  if (modes.length > 1) throw new TypeError('Use only one of "alg", "case" and "state"');
  if ('start' in out && 'state' in out) throw new TypeError('"start" cannot be used with "state"');
  if ('size' in out) {
    const size = out.size;
    if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
      throw new RangeError(`"size" must be a positive finite number (got ${show(size)})`);
    }
  }
  return out as ImageOptions;
}
