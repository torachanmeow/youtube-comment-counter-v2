# YouTube Comment Counter v2

YouTubeライブ配信のチャットをリアルタイムで取得し、スーパーチャット・メンバーシップ・高評価・キーワード出現回数を集計してポイント化するツール。OBS用ウィンドウで配信画面にポイントを表示できます。

> 前バージョン: [youtube-comment-counter](https://github.com/torachanmeow/youtube-comment-counter)（開発終了）

## 主な機能

- **リアルタイム集計** — YouTube Data API v3 でライブチャットを定期取得・自動集計
- **ポイント計算** — 高評価・スパチャ・スパステ・メンバーシップ・キーワードに倍率を設定し、合計ポイントを表示
- **OBS用ウィンドウ** — 別ウィンドウでポイントを表示。フォント・色・アニメーションをカスタマイズ可能
- **ダッシュボード** — 項目別の件数・ポイント一覧、チャットログ、キーワード使用状況
- **為替レート** — 外貨スーパーチャットを自動で円換算
- **キーワード検出** — 最大10個のキーワード、重複カウント制御、ユーザーごとの上限設定

## 動作要件

- Google Chrome / Microsoft Edge
- YouTube Data API v3 キー（[Google Cloud Console](https://console.cloud.google.com/) で取得）

## セットアップ

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成し、YouTube Data API v3 を有効化してAPIキーを取得
2. https://torachanmeow.github.io/youtube-comment-counter-v2/ を開く
3. APIキーと動画ID（またはURL）を入力して「開始」

### ローカルで開発する場合

```bash
npm install && npm run dev
```

> 💡 **APIキーの取り扱い:** APIキーはブラウザの localStorage に保存されます。共有PCでの使用はご注意ください。

## 使い方

1. APIキーと動画ID（またはURL）を入力
2. 「開始」ボタンでデータ取得を開始
3. OBS用ウィンドウを開き、OBSのウィンドウキャプチャで取り込む

| 操作 | 説明 |
|------|------|
| **開始** | データ取得を開始（前回データはリセットされる） |
| **一時停止 / 再開** | 取得を一時停止・再開 |
| **停止** | 取得を停止（データは保持される） |
| **リセット** | 停止後に表示。データをクリアする |

倍率にはマイナス値も設定可能（減点ルール）。

## トラブルシューティング

| 症状 | 対処法 |
|------|--------|
| APIキーが無効 | APIキーを再確認 |
| 利用制限に達した | ポーリング間隔を長くする、時間を置く |
| アクセス拒否 | YouTube Data API v3 の有効化を確認 |
| 動画が見つからない | 動画IDを再確認 |
| ライブチャットが無効 | 公開配信中の動画を使用 |

## ライセンス

[MIT License](LICENSE)
