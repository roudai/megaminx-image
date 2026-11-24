// 大きさ 1 のときの点の表を作る（research.md R5）。
//   npm run build:geometry → src/geometry-table.ts
// サイトの js/megaminx-draw.js の geometry と同じ式で求め、実行時に三角関数を使わずに済むようにする。
// 数値は String(n)（元の値に戻せる最短の表記）で書くので、表から読んだ値は計算した値とぴったり同じ。
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const origin = 0.5;
const R = {
  center: (origin * 35) / 105, // U 面の中心の五角形
  inner: (origin * 80) / 105, // U 面の外周
  outer: (origin * 100) / 105, // 側面の外周
  in: (origin * 65) / 105, // 辺の点（U 面の側）
  out: (origin * 84) / 105, // 辺の点（外周の側）
};
const corner = (r, k) => {
  const t = (2 * Math.PI * k) / 5 + Math.PI / 2;
  return [origin + r * Math.cos(t), origin - r * Math.sin(t) + origin / 12];
};
const edge = (side, k, l) => {
  const r = side === 'in' ? R.in : R.out;
  const gap = side === 'in' ? 0.043 : 0.081;
  const angle = l === 0 ? 0.4 * k + 0.2 - gap : 0.4 * k + 0.2 + gap;
  const t = angle * Math.PI + Math.PI / 2;
  return [origin + r * Math.cos(t), origin - r * Math.sin(t) + origin / 12];
};

const ks = [0, 1, 2, 3, 4];
const pt = (p) => `[${p[0]}, ${p[1]}]`;
const list = (ps) => `[\n${ps.map((p) => '    ' + p + ',').join('\n')}\n  ]`;
const pentagon = (r) => list(ks.map((k) => pt(corner(r, k))));
const edges = (side) => list(ks.map((k) => `[${pt(edge(side, k, 0))}, ${pt(edge(side, k, 1))}]`));

const out = `// 自動生成ファイル。手で編集しないこと。生成: npm run build:geometry（scripts/build-geometry-table.mjs）
// 大きさ 1 のときの点 [x, y]。サイトの js/megaminx-draw.js の geometry と同じ式。
// 頂点 k（0..4）は画像の上から反時計回り、辺 k は頂点 k と k+1 の間（辺 2 が手前＝F 面）。
export type Point = readonly [number, number];

export const UNIT: {
  /** U 面の中心の五角形の頂点 k */
  readonly center: readonly Point[];
  /** U 面の外周の頂点 k */
  readonly inner: readonly Point[];
  /** 側面の外周の頂点 k */
  readonly outer: readonly Point[];
  /** 辺 k の U 面との境の点 [頂点 k の側, 頂点 k+1 の側] */
  readonly edgeIn: readonly (readonly [Point, Point])[];
  /** 辺 k の外周の点 [頂点 k の側, 頂点 k+1 の側] */
  readonly edgeOut: readonly (readonly [Point, Point])[];
} = {
  center: ${pentagon(R.center)},
  inner: ${pentagon(R.inner)},
  outer: ${pentagon(R.outer)},
  edgeIn: ${edges('in')},
  edgeOut: ${edges('out')},
};
`;
writeFileSync(fileURLToPath(new URL('../src/geometry-table.ts', import.meta.url)), out);
console.log('wrote src/geometry-table.ts');
