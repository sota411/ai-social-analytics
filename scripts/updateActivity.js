const fs = require('fs');
const path = require('path');
const { TwitterApi } = require('./twitterService');
const { GeminiService } = require('./geminiService');

// 共通のユーティリティ関数
const ActivityUtils = {
    // 統計データを計算
    calculateStats(tweets, analysis) {
        const tweetCount = tweets.length;
        
        // 主要トピック数を計算
        const topicCount = analysis.topics ? analysis.topics.length : 0;
        
        // 活動度を計算（1日あたりのツイート数に基づく）
        const daysActive = 15;
        const tweetsPerDay = tweetCount / daysActive;
        const engagementRate = Math.min(Math.round(tweetsPerDay * 20), 100); // 最大100%
        
        return {
            tweetCount,
            topicCount,
            engagementRate
        };
    },

    // 空のアクティビティデータを作成
    createEmptyActivityData(generatedBy = 'Local Server') {
        return {
            summary: '過去15日間にツイートはありませんでした。',
            highlights: [],
            topics: [],
            stats: {
                tweetCount: 0,
                topicCount: 0,
                engagementRate: 0
            },
            rawTweets: [],
            lastUpdated: new Date().toISOString(),
            generatedBy
        };
    },

    // フォールバックデータを作成
    createFallbackActivityData(generatedBy = 'Local Server') {
        return {
            summary: 'Gemini APIでの分析に失敗しました。API設定を確認してください。',
            highlights: ["Gemini API の設定を確認してください"],
            topics: [],
            stats: {
                tweetCount: 0,
                topicCount: 0,
                engagementRate: 0
            },
            rawTweets: [],
            lastUpdated: new Date().toISOString(),
            generatedBy: `${generatedBy} (API Error)`,
            error: true
        };
    },

    // 設定を読み込み（GitHub Actions/ローカル環境両対応）
    loadConfig() {
        // 環境変数から設定を取得（GitHub Actions用）
        const envConfig = {
            X_API: {
                BEARER_TOKEN: process.env.X_API_BEARER_TOKEN,
                BASE_URL: 'https://api.twitter.com/2',
                USERNAME: 'Sota_411'
            },
            GEMINI_API: {
                API_KEY: process.env.GEMINI_API_KEY,
                MODEL: 'gemini-2.5-flash-preview-05-20',
                BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models'
            }
        };

        // 環境変数が設定されている場合はそれを使用
        if (envConfig.X_API.BEARER_TOKEN && envConfig.GEMINI_API.API_KEY) {
            return envConfig;
        }

        // ローカル環境では settings.json から読み込み
        try {
            const localConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../settings.json'), 'utf8'));
            return localConfig;
        } catch (error) {
            console.error('設定ファイルの読み込みに失敗しました:', error.message);
            throw new Error('設定ファイルが見つかりません。settings.jsonを確認してください。');
        }
    },

    // データを保存
    saveActivityData(activityData) {
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const activityPath = path.join(dataDir, 'activity.json');
        fs.writeFileSync(activityPath, JSON.stringify(activityData, null, 2));
        return activityPath;
    }
};

async function updateActivity(isStatic = false) {
    try {
        const generatedBy = isStatic ? 'GitHub Actions' : 'Local Server';
        console.log(`アクティビティ更新プロセス開始... (${generatedBy})`);
        
        const config = ActivityUtils.loadConfig();
        
        // Twitter APIサービスの初期化
        const twitterService = new TwitterApi(config.X_API);
        
        // Gemini APIサービスの初期化
        const geminiService = new GeminiService(config.GEMINI_API);
        
        // 過去15日間のツイートを取得
        console.log('過去15日間のツイートを取得中...');
        const tweets = await twitterService.getRecentTweets(15);
        
        if (!tweets || tweets.length === 0) {
            console.log('ツイートが見つかりませんでした');
            const emptyData = ActivityUtils.createEmptyActivityData(generatedBy);
            ActivityUtils.saveActivityData(emptyData);
            return emptyData;
        }
        
        console.log(`${tweets.length}件のツイートを取得しました`);
        
        // Gemini APIでツイートを統合・分析
        console.log('Gemini APIでツイート内容を分析中...');
        
        let analysis;
        try {
            analysis = await geminiService.analyzeTweets(tweets);
        } catch (geminiError) {
            console.error('Gemini API 分析エラー:', geminiError.message);
            
            if (isStatic) {
                // GitHub Actions環境では最低限のフォールバックのみ
                const fallbackData = ActivityUtils.createFallbackActivityData('GitHub Actions');
                ActivityUtils.saveActivityData(fallbackData);
                console.log('Gemini API エラーのためフォールバックデータを保存しました');
                process.exit(1);
            } else {
                // ローカル環境ではエラーを再スロー
                throw new Error(`Gemini API による分析に失敗しました: ${geminiError.message}`);
            }
        }
        
        // 統計データを計算
        const stats = ActivityUtils.calculateStats(tweets, analysis);
        
        // 結果をまとめる（Gemini の結果のみ使用）
        const activityData = {
            summary: analysis.summary,
            highlights: analysis.highlights || [],
            topics: analysis.topics || [],
            mood: analysis.mood || 'ニュートラル',
            technologies: analysis.technologies || [],
            achievements: analysis.achievements || [],
            focus_area: analysis.focus_area || '技術学習',
            stats: stats,
            rawTweets: tweets.slice(0, 5), // 最新5件のみ保存
            lastUpdated: new Date().toISOString(),
            generatedBy: `${generatedBy} (Gemini AI)`
        };
        
        // データを保存
        const savePath = ActivityUtils.saveActivityData(activityData);
        
        console.log('アクティビティデータが正常に更新されました');
        if (isStatic) {
            console.log('保存先:', savePath);
        }
        
        return activityData;
        
    } catch (error) {
        console.error('アクティビティ更新エラー:', error);
        
        if (isStatic) {
            // GitHub Actions環境ではフォールバックデータを保存してプロセス終了
            const fallbackData = ActivityUtils.createFallbackActivityData('GitHub Actions');
            ActivityUtils.saveActivityData(fallbackData);
            console.log('フォールバックデータを保存しました');
            process.exit(1);
        } else {
            // ローカル環境ではエラーを再スロー
            throw error;
        }
    }
}

// 直接実行された場合の処理（GitHub Actions用）
if (require.main === module) {
    updateActivity(true)
        .then(() => {
            console.log('静的アクティビティ更新完了');
            process.exit(0);
        })
        .catch((error) => {
            console.error('静的アクティビティ更新失敗:', error);
            process.exit(1);
        });
}

module.exports = { updateActivity, ActivityUtils }; 