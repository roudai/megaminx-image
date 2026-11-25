# Quickstart: 色を残すステッカーの指定（show）の確かめ方

## 前提

```sh
npm ci
```

## テスト

```sh
npm test            # show のテスト（test/show.test.ts）と、1.0.0 からのテストがすべて通る
npm run typecheck   # show の型
npm run test:browser
```

確かめること：

| シナリオ | 期待 |
|---|---|
| `stickerColors({ show: [17, 18, 19] })` | 17〜19 は 'a'（F）、ほかの側面は 'd'、0〜10 は 'u' |
| `stickerColors({ show: [] })` | 11〜25 がすべて 'd' |
| `show` に 11〜25 をすべて | `show` なしと同じ 26 色 |
| `rotate: 2, show: [18, 19, 20, 21]` | 「`rotate: 2` だけの 26 色」の 18〜21 以外の側面を 'd' にしたもの |
| `show: [17]`, `stickers: { 11: 'r' }` | 11 は 'r' |
| `state` ＋ `show` | `alg` と同じく灰色にする |
| `show: 18` / `'18'` / `{}` / `null` | `TypeError: "show" must be an array of sticker indices (got …)` |
| `show: [26]` / `[-1]` / `[1.5]` / `[NaN]` / `['18']` | `RangeError: Sticker index out of range: … (expected 0-25)` |
| `show` なし | 1.0.0 の正解ファイル・410 ケースの一致がそのまま通る |
| `svg`・`drawCanvas`・`png` に `show` | 灰色にした 26 色で描く |

## README の図

```sh
npm run build:readme-images
git diff --exit-code docs/images   # show.svg 以外は変わらない
```

## 手で見る

```sh
npm run build
node -e "import('./dist/index.js').then(m => process.stdout.write(m.svg({ case: \"R U R' U' R' F R2 U' R' U' R U R' F'\", rotate: 2, show: [18, 19, 20, 21] })))" > /tmp/show.svg
```
