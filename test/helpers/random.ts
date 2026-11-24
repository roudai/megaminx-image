// テスト用の乱数と手順（サイトの test/megaminx-state.test.js と同じ作り方。固定のシードで毎回同じ）
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const MOVES = ['U', 'F', 'R', 'BR', 'BL', 'L', 'DR', 'DBR', 'B', 'DBL', 'DL', 'D', 'y'];
const SUFFIXES = ['', "'", '2', "2'"];

export function randomAlg(rand: () => number, len: number): string {
  return Array.from(
    { length: len },
    () => MOVES[Math.floor(rand() * MOVES.length)] + SUFFIXES[Math.floor(rand() * SUFFIXES.length)],
  ).join(' ');
}
