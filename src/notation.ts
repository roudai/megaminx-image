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

// ---- 手順の道具（contracts/notation.md「道具」）----

/** 回数 → ふつうの書き方（既定データと同じ。1 回 X、2 回 X2、3 回 X2'、4 回 X'） */
const SUFFIX = ['', '', '2', "2'", "'"];

/** 記号を正しい表記に書き直す。例："r u bR' Y" → "R U BR' y"。読めない手順は SyntaxError */
export function canonicalAlg(alg: string): string {
  parseAlg(alg); // 読めない手順は読むときと同じエラーにする（サイトは確かめない。plan.md「サイトとの違い」）
  return normalize(alg).src.replace(new RegExp(FACE_PATTERN, 'gi'), canonicalFace);
}

/**
 * 無駄な手順をまとめる（サイトの simplifyAlg の alg と同じ）。
 *   - 同じ深さで続けて並んだ同じ面（y も）を足し合わせる（R R → R2、R2 R → R2'）。合計 0 回（R R'・R5）は消す。
 *     スタックで処理するので、消えたあとに並んだ同じ面もまとめる（R U U' R' → 空）
 *   - 括弧はまたがない（(R U) U' はそのまま）。中身が空になった括弧は回数ごと消す
 *   - まとめなかった記号は書いたまま（R3 だけなら R3 のまま）。記号は正しい表記、空白は 1 つにそろえる
 */
export function simplifyAlg(alg: string): string {
  parseAlg(alg); // 読めない手順は同じエラーにする
  const n = normalize(alg);
  const src = n.src;
  let at = 0;

  type Item = { face: MoveFace; turns: number; text: string } | { group: string };
  const text = (item: Item) => ('group' in item ? item.group : item.text);

  function seq(): Item[] {
    const out: Item[] = [];
    for (;;) {
      while (src[at] === ' ') at++;
      if (at >= src.length) return out;
      const ch = src[at];
      if (ch === ')') {
        at++;
        return out;
      }
      if (ch === '(') {
        const start = at;
        at++;
        const inner = seq();
        const a = readAmount(n, at, start);
        const suffix = src.slice(at, a.end);
        at = a.end;
        if (inner.length) out.push({ group: '(' + inner.map(text).join(' ') + ')' + suffix });
        continue;
      }
      FACE_RE.lastIndex = at;
      const fm = FACE_RE.exec(src)!;
      const a = readAmount(n, at + fm[0].length, at);
      const face = canonicalFace(fm[0]);
      const k = a.prime ? -a.n : a.n;
      const turns = ((k % 5) + 5) % 5;
      const written = face + src.slice(at + fm[0].length, a.end);
      at = a.end;
      const top = out[out.length - 1];
      if (top && !('group' in top) && top.face === face) {
        const sum = (top.turns + turns) % 5;
        if (sum === 0) out.pop();
        else Object.assign(top, { turns: sum, text: face + SUFFIX[sum] });
      } else if (turns !== 0) {
        out.push({ face, turns, text: written });
      }
    }
  }
  return seq().map(text).join(' ');
}

/**
 * 逆の手順（サイトに無いので新しく決めたもの。contracts/notation.md）。
 *   - 項目の順を逆にし、記号は回数を逆にしてふつうの書き方で書く（R → R'、R2 → R2'、R3 → R2）。0 回の記号は書かない
 *   - 括弧は中身を逆にし、後ろの回数・' は書いたまま残す。中身が空になった括弧は書かない
 *   - 記号は正しい表記、空白は 1 つ。読めない手順は SyntaxError
 */
export function invertAlg(alg: string): string {
  parseAlg(alg);
  const n = normalize(alg);
  const src = n.src;
  let at = 0;

  // 1 つの深さを読み、逆にした項目の文字列の列（逆順）を返す
  function seq(): string[] {
    const out: string[] = [];
    for (;;) {
      while (src[at] === ' ') at++;
      if (at >= src.length) return out.reverse();
      const ch = src[at];
      if (ch === ')') {
        at++;
        return out.reverse();
      }
      if (ch === '(') {
        const start = at;
        at++;
        const inner = seq();
        const a = readAmount(n, at, start);
        const suffix = src.slice(at, a.end);
        at = a.end;
        if (inner.length) out.push('(' + inner.join(' ') + ')' + suffix);
        continue;
      }
      FACE_RE.lastIndex = at;
      const fm = FACE_RE.exec(src)!;
      const a = readAmount(n, at + fm[0].length, at);
      at = a.end;
      const k = a.prime ? -a.n : a.n;
      const inverse = (5 - (((k % 5) + 5) % 5)) % 5;
      if (inverse !== 0) out.push(canonicalFace(fm[0]) + SUFFIX[inverse]);
    }
  }
  return seq().join(' ');
}
