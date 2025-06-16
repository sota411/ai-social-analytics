const axios = require('axios');

class TwitterApi {
    constructor(config) {
        this.bearerToken = config.BEARER_TOKEN;
        this.baseUrl = config.BASE_URL;
        this.username = config.USERNAME;
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.bearerToken}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async getRecentTweets(days = 15) {
        try {
            // まずユーザーIDを取得
            const userId = await this.getUserId();
            
            // 過去N日間の日付を計算
            const endTime = new Date();
            const startTime = new Date();
            startTime.setDate(startTime.getDate() - days);
            
            // ツイートを取得
            const response = await this.client.get(`/users/${userId}/tweets`, {
                params: {
                    'tweet.fields': 'created_at,public_metrics,context_annotations',
                    'max_results': 100,
                    'start_time': startTime.toISOString(),
                    'end_time': endTime.toISOString(),
                    'exclude': 'retweets,replies' // リツイートとリプライは除外
                }
            });

            if (!response.data.data) {
                console.log('指定期間のツイートが見つかりませんでした');
                return [];
            }

            return response.data.data.map(tweet => ({
                id: tweet.id,
                text: tweet.text,
                created_at: tweet.created_at,
                metrics: tweet.public_metrics,
                context: tweet.context_annotations || []
            }));

        } catch (error) {
            console.error('Twitter API エラー:', error.response?.data || error.message);
            
            // エラー時はサンプルデータを返す（デモ用）
            return this.getSampleTweets();
        }
    }

    async getUserId() {
        try {
            const response = await this.client.get('/users/by/username/' + this.username);
            return response.data.data.id;
        } catch (error) {
            console.error('ユーザーID取得エラー:', error.response?.data || error.message);
            throw new Error('ユーザーIDの取得に失敗しました');
        }
    }

    // デモ用のサンプルツイート
    getSampleTweets() {
        console.log('サンプルツイートデータを使用します');
        return [
            {
                id: '1',
                text: '今日はReactの新しいコンポーネントを実装しました！状態管理がかなりスムーズになって満足です。#React #JavaScript #開発',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                metrics: { like_count: 5, retweet_count: 2, reply_count: 1 },
                context: []
            },
            {
                id: '2',
                text: 'インターンでAWSのデプロイについて学んでいます。クラウドインフラの奥深さを実感中... #AWS #インターン #学習',
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                metrics: { like_count: 8, retweet_count: 3, reply_count: 2 },
                context: []
            },
            {
                id: '3',
                text: 'CTF大会で優勝した時の感動が忘れられません。セキュリティ分野ももっと深く学んでいきたい。#CTF #セキュリティ #プログラミング',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                metrics: { like_count: 12, retweet_count: 4, reply_count: 3 },
                context: []
            },
            {
                id: '4',
                text: 'AIとディープラーニングの勉強を続けています。JDLAの資格取得が役立ってる。次はもっと実践的なプロジェクトに挑戦したい！#AI #MachineLearning #JDLA',
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                metrics: { like_count: 15, retweet_count: 6, reply_count: 4 },
                context: []
            },
            {
                id: '5',
                text: 'ポートフォリオサイトを更新しました。tsParticlesを使ったパーティクルエフェクトがお気に入り！ #Portfolio #WebDev #JavaScript',
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                metrics: { like_count: 7, retweet_count: 2, reply_count: 2 },
                context: []
            },
            {
                id: '6',
                text: '基本情報技術者試験に合格しました！次はより高レベルな資格に挑戦していきます。継続は力なり。#基本情報技術者 #資格 #勉強',
                created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
                metrics: { like_count: 20, retweet_count: 5, reply_count: 8 },
                context: []
            }
        ];
    }
}

module.exports = { TwitterApi }; 