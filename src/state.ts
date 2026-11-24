// メガミンクスの状態計算（DOM 非依存）。
// サイトの js/megaminx-state.js の幾何・回転・applyAlg・topView・toImageColors を書き写したもの。
// 132 枚のステッカーの位置を 3 次元で持ち、面ごとの 72° 回転を位置の置換として読み込み時に作る。
// 置換は整数の並びなので、三角関数の最後の桁が環境で違っても結果は同じ（許容 1e-6 で位置を探す）。
import { FACES } from './colors.js';
import { invertMoves, parseAlg, type Move } from './notation.js';
import type { Face } from './types.js';

type Vec = readonly [number, number, number];

// ---- 幾何 ----
const SQ5 = Math.sqrt(5);
const C = 1 / SQ5; // 隣接面の法線の内積
const S = 2 / SQ5;
const T = 0.6; // ステッカーの位置の内側への寄せ係数

export const UPPER: readonly Face[] = ['F', 'R', 'BR', 'BL', 'L'];
const LOWER: readonly Face[] = ['DR', 'DBR', 'B', 'DBL', 'DL'];

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (...vs: Vec[]): Vec => [0, 1, 2].map((i) => vs.reduce((s, v) => s + v[i], 0)) as unknown as Vec;
const mul = (v: Vec, k: number): Vec => [v[0] * k, v[1] * k, v[2] * k];
const rad = (deg: number) => (deg * Math.PI) / 180;

const N = {} as Record<Face, Vec>;
N.U = [0, 0, 1];
N.D = [0, 0, -1];
UPPER.forEach((name, i) => {
  const th = rad(270 + 72 * i); // F = 270°、反時計回りに +72° ずつ
  N[name] = [S * Math.cos(th), S * Math.sin(th), C];
});
LOWER.forEach((name, i) => {
  const th = rad(270 + 36 + 72 * i);
  N[name] = [S * Math.cos(th), S * Math.sin(th), -C];
});

const adjacent = (a: Face, b: Face) => Math.abs(dot(N[a], N[b]) - C) < 1e-9;
const pieceKey = (faces: readonly Face[]) => faces.slice().sort().join(',');

// ---- ステッカー（面ごとに 中心 1 ＋ 辺 5 ＋ 角 5 = 11 枚）----
// key：'c'（中心）か、そのピースが接する面の名前を並べ替えて ',' でつないだもの
interface Sticker {
  readonly face: Face;
  readonly key: string;
  readonly pos: Vec;
}
const STICKERS: Sticker[] = [];
FACES.forEach((f) => {
  STICKERS.push({ face: f, key: 'c', pos: N[f] });
  FACES.forEach((g) => {
    if (g === f || !adjacent(f, g)) return;
    const m = mul(add(N[f], N[g]), 1 / (1 + C)); // 辺の中点
    STICKERS.push({ face: f, key: pieceKey([f, g]), pos: add(mul(N[f], 1 - T), mul(m, T)) });
    FACES.forEach((h) => {
      if (h > g && h !== f && adjacent(f, h) && adjacent(g, h)) {
        const v = mul(add(N[f], N[g], N[h]), 1 / (1 + 2 * C)); // 頂点
        STICKERS.push({ face: f, key: pieceKey([f, g, h]), pos: add(mul(N[f], 1 - T), mul(v, T)) });
      }
    });
  });
});
if (STICKERS.length !== 132) throw new Error('sticker count: ' + STICKERS.length);

const LOOKUP = new Map<string, number>();
STICKERS.forEach((s, i) => LOOKUP.set(s.face + '|' + s.key, i));
const at = (state: readonly Face[], face: Face, faces: 'c' | readonly Face[]) =>
  state[LOOKUP.get(face + '|' + (faces === 'c' ? 'c' : pieceKey(faces)))!];

function rotate(p: Vec, axis: Vec, ang: number): Vec {
  const k = mul(axis, 1 / Math.sqrt(dot(axis, axis)));
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const kxp: Vec = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]];
  return add(mul(p, c), mul(kxp, s), mul(k, dot(k, p) * (1 - c)));
}

function indexOfPos(p: Vec): number {
  for (let i = 0; i < STICKERS.length; i++) {
    const q = STICKERS[i].pos;
    if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) < 1e-6) return i;
  }
  throw new Error('position not found');
}

// 時計回り 72° の置換 perm[元の位置] = 移動先。layerOnly = false なら全体の回転
function makeMove(axisFace: Face, layerOnly: boolean): number[] {
  const axis = N[axisFace];
  return STICKERS.map((s, i) => (!layerOnly || dot(s.pos, axis) > 0.7 ? indexOfPos(rotate(s.pos, axis, -rad(72))) : i));
}

const MOVES = {} as Record<Face | 'y', number[]>;
FACES.forEach((f) => {
  MOVES[f] = makeMove(f, true);
});
MOVES.y = makeMove('U', false);

// ---- 状態 ----
/** 揃った状態（各位置の色 = 初めの面の名前） */
export function solved(): Face[] {
  return STICKERS.map((s) => s.face);
}

export function applyMoves(state: readonly Face[], moves: readonly Move[]): Face[] {
  let st = state.slice();
  for (const m of moves) {
    const perm = MOVES[m.face];
    for (let t = 0; t < m.turns; t++) {
      const next = st.slice();
      for (let i = 0; i < perm.length; i++) next[perm[i]] = st[i];
      st = next;
    }
  }
  return st;
}

export interface ApplyOptions {
  /** 逆の手順を回す（その手順で揃うケースの状態） */
  inverse?: boolean;
  /** 開始の状態（省略時は揃った状態） */
  state?: readonly Face[];
  /** 手順の中の持ち替え（y）の合計を打ち消し、向きを元に戻す */
  cancelRotation?: boolean;
}

/** 手順を回した状態（サイトの applyAlg と同じ） */
export function applyAlg(alg: string, options: ApplyOptions = {}): Face[] {
  let moves = parseAlg(alg);
  if (options.inverse) moves = invertMoves(moves);
  if (options.cancelRotation) {
    const fix: Move = { face: 'y', turns: (5 - netRotation(moves)) % 5 };
    // 逆の手順は「持ち替えを戻してから」、ふつうの手順は「最後に」打ち消す
    moves = options.inverse ? [fix, ...moves] : [...moves, fix];
  }
  return applyMoves(options.state ?? solved(), moves);
}

/** 手順の中の持ち替え（y）の合計（時計回り 72° 単位で 0..4） */
function netRotation(moves: readonly Move[]): number {
  return moves.reduce((sum, m) => (m.face === 'y' ? (sum + m.turns) % 5 : sum), 0);
}

/**
 * 上面の 26 枚の元の面の名前（data-model.md の並び。サイトの toImageColors の ucolor 11 → scolor 15）。
 *   0：U 面の中心／1 + 2k：U 面の角（頂点 k）／2 + 2k：U 面の辺（辺 k）／11 + 3k 〜 13 + 3k：辺 k の側面の上段
 *   辺 k に接する面は UPPER[(k + 3) % 5]（辺 2 が F）
 */
export function topFaces(state: readonly Face[]): Face[] {
  const n = UPPER.length;
  const out: Face[] = [at(state, 'U', 'c')];
  const sides: Face[] = [];
  for (let k = 0; k < 5; k++) {
    const j = (k + 3) % 5; // 辺 k に接する面 UPPER[j]
    const a = UPPER[(k + 2) % 5];
    const b = UPPER[(k + 3) % 5];
    out.push(at(state, 'U', ['U', a, b])); // 頂点 k：UPPER[(k+2)%5] と UPPER[(k+3)%5] の間の角
    out.push(at(state, 'U', ['U', UPPER[j]]));
    const g = UPPER[j];
    const prev = UPPER[(j + n - 1) % n];
    const next = UPPER[(j + 1) % n];
    sides.push(at(state, g, ['U', g, prev]), at(state, g, ['U', g]), at(state, g, ['U', g, next]));
  }
  return out.concat(sides);
}
