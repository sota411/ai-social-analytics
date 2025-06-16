const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor(config) {
        this.apiKey = config.API_KEY;
        this.model = config.MODEL;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.generativeModel = this.genAI.getGenerativeModel({ model: this.model });
    }

    async analyzeContent(content, schema = null, analysisType = 'tweets') {
        try {
            let contentText;
            let prompt;

            if (analysisType === 'tweets' && Array.isArray(content)) {
                contentText = content.map(tweet => `- ${tweet.text}`).join('\n');
                prompt = this._createTwitterAnalysisPrompt(contentText, schema);
            } else if (typeof content === 'string') {
                contentText = content;
                prompt = this._createGenericAnalysisPrompt(contentText, schema, analysisType);
            } else {
                throw new Error('Invalid content format');
            }

            const defaultSchema = {
                "summary": "要約文",
                "highlights": ["重要なポイント"],
                "topics": ["主要なトピック"],
                "mood": "全体的な感情",
                "technologies": ["技術やツール"],
                "achievements": ["成果"],
                "focus_area": "注力分野"
            };

            console.log('Gemini APIにリクエストを送信中...');
            const result = await this.generativeModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log('Gemini APIから応答を受信しました');
            
            return this._parseJsonResponse(text);
            
        } catch (error) {
            console.error('Gemini API エラー:', error.message);
            throw error;
        }
    }

    async analyzeTweets(tweets) {
        return this.analyzeContent(tweets, null, 'tweets');
    }

    _createTwitterAnalysisPrompt(contentText, schema) {
        const schemaText = schema ? JSON.stringify(schema, null, 2) : `{
    "summary": "過去15日間の活動内容を自然な日本語で200文字程度でまとめた文章",
    "highlights": ["特に重要な出来事や成果を3-5個の短い文で表現"],
    "topics": ["主要なトピックやテーマ（最大5個）"],
    "mood": "全体的な感情や雰囲気（ポジティブ/ニュートラル/etc）",
    "technologies": ["言及された技術やツール（最大10個）"],
    "achievements": ["具体的な成果や達成事項（あれば）"],
    "focus_area": "現在最も注力している分野"
}`;

        return `
あなたは優秀なデータアナリストです。以下は過去15日間のTwitterの投稿内容です。これらの内容を分析して、以下の形式でJSON形式で要約してください：

ツイート内容:
${contentText}

要求する分析結果（JSON形式で回答してください）:
${schemaText}

注意：
- 文章はツイート上でされている具体的な内容を織り交ぜてください
- summary は読みやすく、第三者にも理解できる内容にしてください
- highlights は実際の成果や学習内容を具体的に記載してください
- 技術的な内容については専門用語を適切に使用してください
- 全体的にポートフォリオサイトの読者に向けた内容として適切にしてください
- 配列の要素は必ず文字列で返してください
`;
    }

    _createGenericAnalysisPrompt(contentText, schema, analysisType) {
        const schemaText = schema ? JSON.stringify(schema, null, 2) : `{
    "summary": "内容の要約",
    "highlights": ["重要なポイント"],
    "topics": ["主要なトピック"],
    "analysis": "分析結果"
}`;

        return `
以下の${analysisType}コンテンツを分析して、指定された形式でJSON形式で回答してください：

分析対象:
${contentText}

要求する分析結果（JSON形式で回答してください）:
${schemaText}

注意：
- JSON形式で正確に回答してください
- 配列の要素は必ず文字列で返してください
`;
    }

    _parseJsonResponse(text) {
        let jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
                jsonMatch[0] = jsonMatch[1];
            }
        }
        
        if (jsonMatch) {
            try {
                const analysis = JSON.parse(jsonMatch[0]);
                
                console.log('Gemini API 分析完了');
                console.log('分析結果プレビュー:', {
                    summary: analysis.summary?.substring(0, 100) + '...' || 'N/A',
                    highlightsCount: analysis.highlights?.length || 0,
                    topicsCount: analysis.topics?.length || 0,
                    technologiesCount: analysis.technologies?.length || 0
                });
                
                return analysis;
                
            } catch (parseError) {
                console.error('JSON解析エラー:', parseError.message);
                console.error('受信したテキスト:', text.substring(0, 500) + '...');
                throw new Error(`Gemini APIの応答をJSON解析できませんでした: ${parseError.message}`);
            }
        } else {
            console.error('JSON形式の応答が見つかりませんでした');
            console.error('受信したテキスト:', text.substring(0, 500) + '...');
            throw new Error('Gemini APIからJSON形式の応答を取得できませんでした');
        }
    }
}

module.exports = { GeminiService }; 