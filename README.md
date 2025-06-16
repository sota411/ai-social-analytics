# AI Social Media Analytics Dashboard

SNSの活動データをAIで分析し、美しいダッシュボードで表示するWebアプリケーション

## 特徴

- **AI分析**: Gemini APIを使用してソーシャルメディアの投稿を自動分析
- **Twitter API連携**: 過去15日間のツイートを自動取得
- **モダンUI**: レスポンシブ対応の美しいダッシュボード
- **リアルタイム更新**: 定期的なデータ更新機能
- **GitHub Actions対応**: 自動化されたデータ更新

## デモ

[Live Demo](https://sota411.github.io/) のActivitiesセクションで実際の動作を確認できます。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境設定

`settings.json.example`をコピーして`settings.json`を作成し、APIキーを設定してください：

```json
{
  "X_API": {
    "BEARER_TOKEN": "your_twitter_bearer_token",
    "BASE_URL": "https://api.twitter.com/2",
    "USERNAME": "your_twitter_username"
  },
  "GEMINI_API": {
    "API_KEY": "your_gemini_api_key",
    "MODEL": "gemini-2.5-flash-preview-05-20",
    "BASE_URL": "https://generativelanguage.googleapis.com/v1beta/models"
  }
}
```

### 3. 開発サーバーの起動

```bash
npm start
```

## 使用方法

### ローカル開発

1. サーバーを起動: `npm start`
2. ブラウザで `http://localhost:3000` にアクセス
3. アクティビティデータが自動で読み込まれます

### GitHub Actions での自動更新

1. GitHub Secretsに以下の環境変数を設定：
   - `X_API_BEARER_TOKEN`
   - `GEMINI_API_KEY`

2. `.github/workflows/update-activity.yml`が自動でデータ更新を実行

## ファイル構成

```
├── src/
│   ├── js/
│   │   └── dashboard.js          # ダッシュボードのメイン機能
│   ├── css/
│   │   └── dashboard.css         # ダッシュボードのスタイル
│   └── index.html                # メインHTML
├── scripts/
│   ├── geminiService.js          # Gemini API サービス
│   ├── twitterService.js         # Twitter API サービス
│   └── updateActivity.js         # データ更新スクリプト
├── data/
│   └── activity.json             # 生成された分析データ
├── .github/workflows/
│   └── update-activity.yml       # GitHub Actions設定
├── package.json
└── README.md
```

## API設定

### Twitter API

1. [Twitter Developer Portal](https://developer.twitter.com/)でアプリを作成
2. Bearer Tokenを取得
3. `settings.json`または環境変数で設定

### Gemini API

1. [Google AI Studio](https://aistudio.google.com/)でAPIキーを取得
2. `settings.json`または環境変数で設定

## API機能

### 汎用的なAI分析機能

v1.1.0からGeminiServiceが汎用的な分析機能をサポートします：

```javascript
const { GeminiService } = require('./scripts/geminiService');

// 従来のTwitter分析（後方互換性あり）
const twitterResult = await geminiService.analyzeTweets(tweets);

// カスタムスキーマでの汎用分析
const customSchema = {
  "summary": "要約",
  "sentiment": "感情分析",
  "keywords": ["キーワード"]
};
const result = await geminiService.analyzeContent(
  textContent, 
  customSchema, 
  'blog'
);
```

### 分析結果のJSON形式

標準的なレスポンス形式：
```json
{
  "summary": "内容の要約",
  "highlights": ["重要なポイント"],
  "topics": ["主要なトピック"],
  "mood": "感情分析",
  "technologies": ["技術要素"],
  "achievements": ["成果"],
  "focus_area": "注力分野"
}
```

## カスタマイズ

### 分析内容の変更

`scripts/geminiService.js`の`analyzeContent`メソッドでカスタムスキーマを使用して分析内容をカスタマイズできます。

### UI のカスタマイズ

`src/css/dashboard.css`でダッシュボードの見た目を変更できます。

## 注意事項

- AI分析による結果のため、内容に誤りが含まれる可能性があります
- Twitter APIのレート制限にご注意ください
- Gemini APIの使用制限にご注意ください

## ライセンス

MIT License

## 貢献

プルリクエストやイシューは歓迎です！

## 作者

[sota411](https://github.com/sota411)