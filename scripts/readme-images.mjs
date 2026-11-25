// README の画像の例（原則 VIII：手で作った画像を置かず、ライブラリ自身で作り直せるようにする）。
// readmeImages(lib) は { ファイル名: SVG の文字列 } を返す。lib はビルドした dist（scripts/build-readme-images.mjs）か、
// テストでは src（test/readme-images.test.ts）。どちらでも同じ文字列になることをテストで確かめる。

/**
 * @param {{ svg: Function, ollScheme: Function, PLL_CASES: any[], OLL_CASES: any[], stickerPolygons: Function, centroid: Function }} lib
 * @returns {Record<string, string>}
 */
export function readmeImages(lib) {
  const pll = (name) => lib.PLL_CASES.find((c) => c.name === name);
  const oll = (name) => lib.OLL_CASES.find((c) => c.name === name);
  const a1 = pll('A1+');
  const oll1a = oll('1A');

  const images = {
    'solved.svg': lib.svg(),
    'alg.svg': lib.svg({ alg: "R U R' U'" }),
    'case.svg': lib.svg({ case: a1.alg }),
    'state.svg': lib.svg({
      // F の辺が裏返った状態（番号 6 と 18 を入れ替え）
      state: ['u', 'u', 'u', 'u', 'u', 'u', 'a', 'u', 'u', 'u', 'u', 'p', 'p', 'p', 'c', 'c', 'c', 'a', 'u', 'a', 'o', 'o', 'o', 'l', 'l', 'l'],
    }),
    'rotate-0.svg': lib.svg({ case: a1.alg, size: 150 }),
    'rotate-1.svg': lib.svg({ case: a1.alg, size: 150, rotate: 1 }),
    'rotate-2.svg': lib.svg({ case: a1.alg, size: 150, rotate: 2 }),
    // show：Y1+ を rotate: 2 で見ると、18〜21（下の面のエッジとコーナー、右隣の面のエッジ）がちょうど 1 つのブロック
    // （ほかの側面に揃った面もブロックも無い）。PLL のデータを全部調べて、この条件に合うものから選んだ
    'show.svg': lib.svg({ case: pll('Y1+').alg, size: 150, rotate: 2, show: [18, 19, 20, 21] }),
    'oll.svg': lib.svg({ case: oll1a.alg, scheme: lib.ollScheme() }),
    'style.svg': lib.svg({ case: a1.alg, background: '#ffffff', lineColor: '#1e90ff', size: 200 }),
    'sticker-order.svg': stickerOrder(lib),
  };
  return images;
}

// ステッカーの並び順の図：揃った状態の画像に、各ステッカーの番号を書き込む
function stickerOrder(lib) {
  const size = 400;
  const base = lib.svg({ size, state: Array(26).fill('w'), background: '#ffffff' });
  const labels = lib
    .stickerPolygons(size)
    .map((p) => {
      const [x, y] = lib.centroid(p.points).map((v) => Math.round(v * 100) / 100);
      return `<text x="${x}" y="${y}">${p.index}</text>`;
    })
    .join('');
  const text = `<g font-family="sans-serif" font-size="16" font-weight="bold" fill="#000000" text-anchor="middle" dominant-baseline="central">${labels}</g>`;
  return base.replace(/<\/svg>$/, text + '</svg>');
}
