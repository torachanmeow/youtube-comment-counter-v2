# YouTube Comment Counter v2

YouTubeライブ配信のチャットをリアルタイムで取得し、スーパーチャット・スーパーステッカー・メンバーシップ・高評価・キーワード出現回数を集計してポイント化するツール。OBS用ウィンドウで配信画面にポイントを表示できます。

> 前バージョン: [youtube-comment-counter](https://github.com/torachanmeow/youtube-comment-counter)（開発終了）

## 機能概要

- **リアルタイム集計**: YouTube Data API v3 でライブチャットを定期取得・自動集計
- **ポイント計算**: 各項目に倍率を設定し、合計ポイントをリアルタイム表示
- **OBS用ウィンドウ**: 別ウィンドウでポイントを表示。フォント・色・アニメーションをカスタマイズ可能
- **ダッシュボード**: 項目別の件数・ポイント一覧、チャットログ、キーワード使用状況を表示
- **為替レート**: 外貨スーパーチャットを自動で円換算（ExchangeRate-API）
- **キーワード検出**: 最大10個のキーワードを設定、絵文字コード内の誤検出を防止
- **重複制御**: キーワードの重複カウントを許可/禁止、ユーザーごとの上限設定
- **データ保持**: 停止してもデータを保持。リセットは明示的に実行
- **タブ間同期**: BroadcastChannel でメインウィンドウとOBS用ウィンドウをリアルタイム同期

## 画面構成

```
+-----------------------------------------------------+
|         YouTube Comment Counter                      |
|            [一時停止]  [停止]                          |
+-----------------------------------------------------+
|  合計ポイント  +1,234                                  |
|          12,345                                      |
|   ● 実行中   最終取得: 12:00:00   次回: 10秒後         |
+-----------------------------------------------------+
| [設定] [OBS設定] [ダッシュボード] [為替レート]  [OBSを開く] |
+-----------------------------------------------------+
```

## セットアップ

### 必要条件

- Node.js 18+
- モダンブラウザ（Chrome / Edge 推奨）
- YouTube Data API v3 キー（[Google Cloud Console](https://console.cloud.google.com/)）

### YouTube API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) で新しいプロジェクトを作成
2. YouTube Data API v3 を有効化
3. 認証情報からAPIキーを作成
4. APIキーをコピー

### インストール・起動

```bash
npm install
npm run dev
```


### 本番ビルド

```bash
npm run build
```

`dist/` に静的ファイルが出力される。

## 使い方

1. APIキーと動画ID（またはURL）を入力
2. 「開始」ボタンでデータ取得を開始
3. 必要に応じてOBS用ウィンドウを開き、OBSのウィンドウキャプチャで取り込む

### 基本操作

| 操作 | 説明 |
|------|------|
| **開始** | データ取得を開始（前回データはリセットされる） |
| **一時停止 / 再開** | 取得を一時停止・再開 |
| **停止** | 取得を停止（データは保持される） |
| **リセット** | 停止後に表示。データをクリアする |

### ポイント倍率

| 項目 | 説明 |
|------|------|
| 高評価 | 高評価数 × 倍率 |
| スーパーチャット | 円換算額 × 倍率 |
| スーパーステッカー | 円換算額 × 倍率 |
| メンバーシップ | 加入・ギフト数 × 倍率 |
| キーワード（10個） | 出現回数 × 倍率 |

倍率にはマイナス値も設定可能（減点ルール）。

### OBS用ウィンドウ設定

| 設定 | 説明 |
|------|------|
| テキスト色 / 背景色 | カラーピッカーで選択 |
| フォントサイズ | 10〜200px |
| 文字間隔 | 0〜50px |
| 左右余白 / 上下余白 | 0〜200px |
| 表示モード | 数字のみ / ラベル付き |
| フォント | 9種類から選択（Noto Sans JP, JetBrains Mono, Orbitron 等） |
| アニメーション | なし / カウントアップ / バウンス / フリップ |
| ウィンドウサイズ | 幅・高さを指定 |

## 技術仕様

### アーキテクチャ

| 項目 | 仕様 |
|------|------|
| フレームワーク | React 19 + TypeScript |
| ビルドツール | Vite 7 |
| 状態管理 | Zustand 5（localStorage 永続化） |
| スタイル | CSS Modules + CSS Custom Properties |
| タブ間同期 | BroadcastChannel API |

### データ取得

| 項目 | 仕様 |
|------|------|
| API | YouTube Data API v3 |
| 取得間隔 | 10〜300秒（設定可能） |
| 為替レート | ExchangeRate-API（24時間キャッシュ） |
| パラメータ | URLSearchParams でエンコード |
| タイムアウト | AbortController による制御 |

### メモリ管理

| 項目 | 仕様 |
|------|------|
| チャットログ | CircularBuffer（最大500件） |
| メッセージID | LRUSet（重複排除用） |
| ユーザー履歴 | LRUMap（キーワード重複制御用） |

### セキュリティ

- APIリクエストパラメータは `URLSearchParams` でエスケープ
- 動画IDは `[a-zA-Z0-9_-]` 以外の文字を除去
- BroadcastChannel メッセージの型チェック
- チャットテキストの HTML サニタイズ

**注意:** APIキーはブラウザの localStorage に保存されます。共有PCでの使用はご注意ください。

## プロジェクト構成

```
src/
  main.tsx                          # エントリーポイント
  App.tsx                           # ルートコンポーネント・タブ管理
  types/
    index.ts                        # 共通型定義
  stores/
    useSettingsStore.ts             # 設定ストア（localStorage 永続化）
    useChatStore.ts                 # チャットデータストア
  hooks/
    useAppController.ts             # アプリ制御（開始・停止・リセット）
    usePolling.ts                   # ポーリング制御
    useYouTubeAPI.ts                # YouTube API フック
    useChatProcessor.ts             # メッセージ処理フック
    useExchangeRate.ts              # 為替レート取得フック
  services/
    youtubeAPI.ts                   # YouTube API クライアント
    exchangeRateAPI.ts              # 為替レート API クライアント
  utils/
    constants.ts                    # 定数定義
    messageProcessor.ts             # メッセージ解析・キーワード検出
    points.ts                       # ポイント計算
    broadcast.ts                    # BroadcastChannel ユーティリティ
    memoryManager.ts                # CircularBuffer / LRUSet / LRUMap
    text.ts                         # テキストサニタイズ
  components/
    Header/                         # アプリヘッダー
    Controls/                       # 操作ボタン（開始・停止・リセット）
    Counter/                        # 合計ポイント表示・項目別テーブル
    Settings/                       # API設定・倍率・キーワード設定
    Stream/
      StreamSettings.tsx            # OBS用ウィンドウ設定・プレビュー
      StreamWindow.tsx              # OBS用ウィンドウ本体
    Dashboard/
      LiveChat.tsx                  # チャットログ（ハイライト付き）
      KeywordUsers.tsx              # キーワード使用状況
      ExchangeRate.tsx              # 為替レート一覧
      VideoInfo.tsx                 # 動画情報
    Toast/                          # 通知トースト
    ErrorBoundary/                  # エラーバウンダリ
  styles/
    global.css                      # グローバルスタイル（CSS変数・テーマ）
```

## トラブルシューティング

### APIエラー

| エラー | 原因 | 対処法 |
|--------|------|--------|
| APIキーが無効 | キー設定ミス | APIキーを再確認 |
| 利用制限に達した | API クォータ超過 | ポーリング間隔を長くする、時間を置く |
| アクセス拒否 | 権限不足 | YouTube Data API v3 の有効化を確認 |

### 配信関連

| エラー | 原因 | 対処法 |
|--------|------|--------|
| 動画が見つからない | 動画ID間違い | 動画IDを再確認 |
| ライブチャットが無効 | 配信終了 or 非公開 | 公開配信中の動画を使用 |
| データが0のまま | OBSウィンドウ未対応 | アプリを最新版に更新 |

## 対応ブラウザ

- Google Chrome（推奨）
- Microsoft Edge

## 使用API・ライブラリ

- [YouTube Data API v3](https://developers.google.com/youtube/v3) - ライブチャット・動画情報取得
- [ExchangeRate-API](https://www.exchangerate-api.com/) - 為替レート取得
- [React](https://react.dev/) - MIT License
- [Zustand](https://github.com/pmndrs/zustand) - MIT License
- [Vite](https://vite.dev/) - MIT License

## ライセンス

このプロジェクトはMITライセンスのもとで提供されます。
