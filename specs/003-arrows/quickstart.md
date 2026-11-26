# Quickstart: ステッカーからステッカーへの矢印（arrows）の確かめ方

## 前提

```sh
npm ci
```

## テスト

```sh
npm test            # test/arrows.test.ts と、1.1.0 からのテスト
npm run typecheck
npm run test:browser   # 矢印のある図も、3 種のブラウザーで Node.js と同じ SVG
npm run test:perf
```

確かめること：

| シナリオ | 期待 |
|---|---|
| `arrows` を省く・`[]` | 1.1.0 と同じ SVG（`test/svg/` の正解ファイル） |
| H1+ の `case` ＋ 5 本 | 座標がスナップショットと同じ。矢印の組が、色から計算した「揃えると行く位置」と一致 |
| `[[12, 15], [15, 12]]` | 両矢印 1 本（矢じり 2 つ） |
| `[[12, 15], [12, 15]]` | 1 本 |
| `[[2, 12]]` などの隣り合う 2 枚の両矢印 | 矢じりが縮み、重ならない |
| `rotate: 0` と `rotate: 2` で同じ `arrows` | 矢印の部分の文字列が同じ |
| `show` ＋ `arrows` | 灰色の図の上に矢印 |
| `arrowColor: 'r'` | 矢印は `#ff0000`、縁取りは `#ffffff` |
| `stickerColors({ arrows })` | `TypeError: Unknown option: "arrows"` |
| 誤った `arrows` | 4 種のエラー |
| `svg`・`drawCanvas`・`png` | 同じ矢印（canvas は同じ点・同じ順の呼び出し、PNG は SVG から） |

## README の図

```sh
npm run build:readme-images
git diff --exit-code docs/images   # arrows.svg・arrows-swap.svg 以外は変わらない
```

## 手で見る

```sh
npm run build
node -e "import('./dist/index.js').then(async m => { const { PLL_CASES } = await import('./dist/cases/index.js'); process.stdout.write(m.svg({ case: PLL_CASES.find(c => c.name === 'H1+').alg, arrows: [[18, 15], [15, 12], [12, 24], [24, 21], [21, 18]] })) })" > /tmp/arrows.svg
```
