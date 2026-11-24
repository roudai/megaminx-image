# 公開の手順

npm への公開は、GitHub で Release を公開すると GitHub Actions（`.github/workflows/publish.yml`）が行う。
npm の Trusted Publishing を使うので、トークンもワンタイムパスワードも要らない。

## 1. バージョンを決める

セマンティック バージョニングに従う（README の「Versioning」、憲章の原則 V）。

| 変更 | 上げる桁 | 例 |
|---|---|---|
| 公開の API・画像の見た目（SVG の構造）・ステッカーの番号を変えた | メジャー | 1.2.3 → 2.0.0 |
| 互換のある機能を足した（オプション・関数・ケースのデータなど） | マイナー | 1.2.3 → 1.3.0 |
| 不具合を直しただけ（出力が正しくなる方向） | パッチ | 1.2.3 → 1.2.4 |

SVG の文字列が 1 バイトでも変わる変更は、テストの正解ファイル（`test/svg/`）も変わる。見た目の変更かどうかの目安にする。

## 2. 公開する

1. ブランチで `package.json` の `version` を上げる（`npm version <新しい番号> --no-git-tag-version`）。
   `package-lock.json` も一緒に変わる。
2. PR を作り、CI が通ったら main にマージする。
3. GitHub で Release を作る。
   - タグ：`v<新しい番号>`（例：`v1.1.0`）。対象は main
   - 説明：変わったことを英語で書く（公開の文書なので。原則 VIII）
4. Release を公開すると Actions の「Publish」が動く。
   - タグと `package.json` の `version` が違えば、公開せずに止まる
   - `prepublishOnly` で、ビルド・型の確認・テストが走る
5. npm の段階的な公開（staged publishing）になった場合は、npmjs.com で承認する。
   承認するまで、その版はインストールできない。

## 3. 公開したあとの確認

```sh
npm view megaminx-image dist-tags versions
```

`latest` が新しい番号になっていることを見る。公開の直後は、本体のダウンロードが数分 404 になることがある。
そのあと空のフォルダで入れて試す。

```sh
npm install megaminx-image@<新しい番号>
node -e "import('megaminx-image').then(m => console.log(m.svg({}).slice(0, 40)))"
```

## 4. うまくいかないとき

### Actions が「Tag … does not match package.json version …」で止まった

Release のタグと `version` が違う。Release とタグを消し、正しいタグで作り直す。

### Actions の `npm publish` が認証のエラーで失敗した

npmjs.com のパッケージの Settings → Trusted Publisher の設定を確かめる。登録している値は次のとおり。

| 項目 | 値 |
|---|---|
| Publisher | GitHub Actions |
| Organization or user | `roudai` |
| Repository | `megaminx-image` |
| Workflow filename | `publish.yml` |
| Environment | 空欄 |

ワークフローのファイル名を変えたら、ここも変える。

### 手で公開する

Actions が使えないときは、手元の main で公開できる。

```sh
npm login
npm publish
```

アカウントの 2 段階認証が要る（メールの確認コードでは公開できない。パスキーか認証アプリ）。
パスキーなら、表示される URL をブラウザで開いて認証する。

## 注意

- 一度公開した番号は二度と使えない。取り消し（`npm unpublish`）できるのは公開から 72 時間以内だけ。
  間違えたら、取り消すより次の番号で直したものを出す方が安全。
- `0.0.0-stage` は、初めて公開したときに段階的な公開で作られた仮の版。`latest` には影響しない。
