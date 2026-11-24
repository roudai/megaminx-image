// 入口 megaminx-image/png：PNG のバイト列（Node.js 用。research.md R7）。
// SVG を任意の依存 @resvg/resvg-js で PNG にする。入っていなければ入れ方を書いたエラーにする。
import { svg } from './svg.js';
import type { ImageOptions } from './types.js';

const INSTALL_MESSAGE = 'Install "@resvg/resvg-js" to export PNG (npm install @resvg/resvg-js)';

/** 最後の層の画像を PNG のバイト列で返す */
export async function png(options?: ImageOptions): Promise<Uint8Array> {
  const image = svg(options); // 設定の間違いは、依存を読む前に svg と同じエラーにする
  let resvg: typeof import('@resvg/resvg-js');
  try {
    resvg = await import('@resvg/resvg-js');
  } catch (cause) {
    throw new Error(INSTALL_MESSAGE, { cause });
  }
  const bytes = new resvg.Resvg(image).render().asPng();
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export type { ImageOptions } from './types.js';
