// 回転記号の読み方（contracts/notation.md）。
// サイトの js/megaminx-state.js の normalize・readAmount・parseAlg・invertMoves を書き写したもの。
// 違い：エラーのメッセージに、元の文字列の中の位置を足す（原則 VI。plan.md「サイトとの違い」）。
import type { Face } from './types.js';

export type MoveFace = Face | 'y';

/** 読んだ手順の 1 手。turns は時計回り 72° 単位の 0..4 */
export interface Move {
  readonly face: MoveFace;
  readonly turns: number;
}

// 大文字・小文字は区別しない。長い記号から先に試す（DBR を D・B・R と読まないように）
export const FACE_PATTERN = 'DFR|DFL|DBR|DBL|BR|BL|DR|DL|U|F|R|L|B|D|Y';
const FACE_RE = new RegExp(FACE_PATTERN, 'iy');
const ALIASES: Readonly<Record<string, MoveFace>> = { DFR: 'DR', DFL: 'DL', Y: 'y' };
const AMOUNT_RE = /(\d*)(')?(\d*)/y;

/** 読んだ記号 → 正しい表記（BR・DR・y など） */
export function canonicalFace(text: string): MoveFace {
  const upper = text.toUpperCase();
  return ALIASES[upper] ?? (upper as Face);
}

/** 読む前の置き換えをした文字列と、その各文字の元の文字列での位置 */
export interface Normalized {
  readonly src: string;
  /** pos[i] = src[i] の元の位置。pos[src.length] = 元の長さ */
  readonly pos: readonly number[];
}

/**
 * 読む前の置き換え（サイトの normalize と同じ結果）。
 * 全角などのアポストロフィ → '、全角の括弧 → 半角、空白（全角を含む）・,・、の続き → 半角の空白 1 つ
 */
export function normalize(alg: string): Normalized {
  let src = '';
  const pos: number[] = [];
  for (let i = 0; i < alg.length; i++) {
    let ch = alg[i];
    if (/[’‘′`´]/.test(ch)) ch = "'";
    else if (ch === '（') ch = '(';
    else if (ch === '）') ch = ')';
    else if (/[\s　,、]/.test(ch)) {
      const start = i;
      while (i + 1 < alg.length && /[\s　,、]/.test(alg[i + 1])) i++;
      src += ' ';
      pos.push(start);
      continue;
    }
    src += ch;
    pos.push(i);
  }
  pos.push(alg.length);
  return { src, pos };
}

export function invertMoves(moves: readonly Move[]): Move[] {
  return moves
    .slice()
    .reverse()
    .map((m) => ({ face: m.face, turns: (5 - m.turns) % 5 }));
}

interface Amount {
  readonly n: number;
  readonly prime: boolean;
  readonly end: number;
}

/** 回数と ' を読む。start は記号の先頭（エラー表示用） */
export function readAmount(n: Normalized, at: number, start: number): Amount {
  AMOUNT_RE.lastIndex = at;
  const m = AMOUNT_RE.exec(n.src)!;
  if (m[1] && m[3]) {
    throw invalidMove(n, start, at + m[0].length);
  }
  const digits = m[1] || m[3];
  return { n: digits ? parseInt(digits, 10) : 1, prime: !!m[2], end: at + m[0].length };
}

function invalidMove(n: Normalized, start: number, end: number): SyntaxError {
  return new SyntaxError(`Invalid move: ${JSON.stringify(n.src.slice(start, end))} (at position ${n.pos[start]})`);
}

/** 手順の文字列を手の列にする（括弧は展開する）。読めなければ SyntaxError */
export function parseAlg(alg: string): Move[] {
  const n = normalize(alg);
  const src = n.src;
  let at = 0;

  // open：この深さを開いた括弧の位置（深さ 0 は null）
  function seq(open: number | null): Move[] {
    let out: Move[] = [];
    for (;;) {
      while (src[at] === ' ') at++;
      if (at >= src.length) {
        if (open !== null) {
          throw new SyntaxError(`Missing closing parenthesis (opened at position ${n.pos[open]})`);
        }
        return out;
      }
      const ch = src[at];
      if (ch === ')') {
        if (open === null) throw new SyntaxError(`Unmatched ")" (at position ${n.pos[at]})`);
        at++;
        return out;
      }
      if (ch === '(') {
        const start = at;
        at++;
        const inner = seq(start);
        const a = readAmount(n, at, start);
        at = a.end;
        let group: Move[] = [];
        for (let i = 0; i < a.n; i++) group = group.concat(inner);
        out = out.concat(a.prime ? invertMoves(group) : group);
        continue;
      }
      FACE_RE.lastIndex = at;
      const fm = FACE_RE.exec(src);
      if (!fm) {
        const rest = src.slice(at).split(' ')[0];
        throw invalidMove(n, at, at + rest.length);
      }
      const a = readAmount(n, at + fm[0].length, at);
      at = a.end;
      const k = a.prime ? -a.n : a.n;
      out.push({ face: canonicalFace(fm[0]), turns: ((k % 5) + 5) % 5 });
    }
  }

  return seq(null);
}
