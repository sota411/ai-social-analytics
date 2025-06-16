// Modern Activity Dashboard Manager
class ModernActivityDashboard {
    constructor() {
        this.summaryElement = document.getElementById('summaryContent');
        this.lastUpdatedElement = document.getElementById('lastUpdated');
        this.tweetCountElement = document.getElementById('tweetCount');
        this.topicCountElement = document.getElementById('topicCount');
        this.engagementRateElement = document.getElementById('engagementRate');
        this.insightsGrid = document.getElementById('insightsGrid');
        this.activityTimeline = document.getElementById('activityTimeline');
        
        this.init();
    }

    async init() {
        try {
            await this.loadActivity();
            // 5分ごとに更新をチェック
            setInterval(() => this.loadActivity(), 5 * 60 * 1000);
        } catch (error) {
            console.error('アクティビティ初期化エラー:', error);
            this.showError();
        }
    }

    async loadActivity() {
        try {
            // GitHub Pages環境でもローカル環境でも静的ファイルから読み込み
            // const isGitHubPages = window.location.hostname === 'sota411.github.io' || 
            //                      window.location.hostname.includes('github.io') ||
            //                      !window.location.hostname.includes('localhost');
            
            let response;
            // if (isGitHubPages) {
            //     // 静的ファイルから読み込み
            //     response = await fetch('./data/activity.json');
            // } else {
            //     // ローカル環境ではAPIから読み込み
            //     response = await fetch('/api/activity');
            // }
            
            // キャッシュバスティングのためタイムスタンプを追加
            const timestamp = new Date().getTime();
            response = await fetch(`./data/activity.json?t=${timestamp}`); // 常に静的ファイルから読み込む
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateUI(data);
            
        } catch (error) {
            console.error('アクティビティ読み込みエラー:', error);
            this.showError();
        }
    }

    updateUI(data) {
        // Summary content update with modern styling
        if (this.summaryElement) {
            this.summaryElement.innerHTML = this.formatModernSummary(data.summary);
            this.summaryElement.classList.add('updated');
            
            setTimeout(() => {
                this.summaryElement.classList.remove('updated');
            }, 600);
        }

        // Last updated with modern format
        if (this.lastUpdatedElement && data.lastUpdated) {
            const updatedDate = new Date(data.lastUpdated);
            this.lastUpdatedElement.textContent = 
                `${updatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${updatedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        }

        // Enhanced stats update with animations
        if (data.stats) {
            this.updateModernStats(data.stats);
        }

        // Generate modern insights
        if (data.mood || data.technologies || data.achievements || data.focus_area) {
            this.generateInsights(data);
        }

        // Create activity timeline
        if (data.highlights && data.highlights.length > 0) {
            this.createTimeline(data.highlights);
        }
    }

    formatModernSummary(summary) {
        if (!summary) {
            return `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Analyzing activities...</p>
                </div>
            `;
        }
        
        const paragraphs = summary.split('\n').filter(p => p.trim().length > 0);
        return `
            <div class="summary-text">
                ${paragraphs.map(p => `<p>${p.trim()}</p>`).join('')}
            </div>
        `;
    }

    updateModernStats(stats) {
        const statItems = [
            { element: this.tweetCountElement, value: stats.tweetCount || 0, max: 100 },
            { element: this.topicCountElement, value: stats.topicCount || 0, max: 20 },
            { element: this.engagementRateElement, value: stats.engagementRate || 0, max: 100, suffix: '%' }
        ];

        statItems.forEach((item, index) => {
            if (item.element) {
                setTimeout(() => {
                    this.animateStatNumber(item.element, item.value, item.suffix);
                    this.animateStatBar(item.element, item.value, item.max);
                }, index * 200);
            }
        });
    }

    animateStatNumber(element, targetValue, suffix = '') {
        const startValue = 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
            
            element.textContent = currentValue + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    animateStatBar(element, value, max) {
        const card = element.closest('.stat-card');
        if (card) {
            const progressBar = card.querySelector('.stat-progress');
            if (progressBar) {
                const percentage = Math.min((value / max) * 100, 100);
                setTimeout(() => {
                    progressBar.style.width = `${percentage}%`;
                }, 300);
            }
        }
    }

    generateInsights(data) {
        if (!this.insightsGrid) return;

        const insights = [];

        if (data.focus_area) {
            insights.push({
                type: 'focus',
                icon: 'fas fa-bullseye',
                title: 'Current Focus',
                content: data.focus_area,
                color: 'var(--accent-color-1)'
            });
        }

        if (data.mood) {
            insights.push({
                type: 'mood',
                icon: 'fas fa-smile',
                title: 'Overall Mood',
                content: data.mood,
                color: 'var(--accent-color-2)'
            });
        }

        if (data.technologies && data.technologies.length > 0) {
            insights.push({
                type: 'tech',
                icon: 'fas fa-code',
                title: 'Technologies',
                content: data.technologies.slice(0, 3).join(', '),
                color: 'var(--accent-color-1)'
            });
        }

        this.insightsGrid.innerHTML = insights.map(insight => `
            <div class="insight-card" data-type="${insight.type}">
                <div class="insight-icon" style="color: ${insight.color}">
                    <i class="${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.content}</p>
                </div>
            </div>
        `).join('');
    }

    createTimeline(highlights) {
        if (!this.activityTimeline) return;

        this.activityTimeline.innerHTML = highlights.slice(0, 5).map((highlight, index) => `
            <div class="timeline-item" style="animation-delay: ${index * 0.1}s">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <p>${highlight}</p>
                    <span class="timeline-time">${this.getRelativeTime(index)}</span>
                </div>
            </div>
        `).join('');
    }

    getRelativeTime(index) {
        const times = ['2h ago', '5h ago', '1d ago', '2d ago', '3d ago'];
        return times[index] || `${index + 1}d ago`;
    }

    updateStats(stats) {
        if (this.tweetCountElement) {
            this.animateNumber(this.tweetCountElement, stats.tweetCount || 0);
        }

        if (this.topicCountElement) {
            this.animateNumber(this.topicCountElement, stats.topicCount || 0);
        }

        if (this.engagementRateElement) {
            this.animateNumber(this.engagementRateElement, stats.engagementRate || 0, '%');
        }
    }

    animateNumber(element, targetValue, suffix = '') {
        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000; // 1秒
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // イージング関数（easeOutCubic）
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
            
            element.textContent = currentValue + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    formatSummary(summary) {
        if (!summary) return '<p class="loading-message">アクティビティを読み込み中...</p>';
        
        // 文章を段落に分割
        const paragraphs = summary.split('\n').filter(p => p.trim().length > 0);
        return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    }

    showHighlights(highlights) {
        // ハイライトを表示する要素があれば追加
        const summaryContent = this.summaryElement;
        if (summaryContent && highlights.length > 0) {
            const highlightsHtml = `
                <div class="activity-highlights">
                    <h4>主な活動</h4>
                    <ul>
                        ${highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            // 既存のハイライトを削除
            const existingHighlights = summaryContent.querySelector('.activity-highlights');
            if (existingHighlights) {
                existingHighlights.remove();
            }
            
            summaryContent.insertAdjacentHTML('beforeend', highlightsHtml);
        }
    }

    showGeminiDetails(data) {
        // Gemini分析の詳細情報を表示する要素を作成
        let detailsContainer = document.querySelector('.gemini-details');
        
        if (!detailsContainer) {
            detailsContainer = document.createElement('div');
            detailsContainer.className = 'gemini-details';
            this.summaryElement.parentElement.appendChild(detailsContainer);
        }
        
        let detailsHtml = '<div class="gemini-analysis-header"><h4><i class="fas fa-robot"></i> AI分析結果</h4></div>';
        
        // 注力分野
        if (data.focus_area) {
            detailsHtml += `
                <div class="analysis-item focus-area">
                    <div class="item-header">
                        <i class="fas fa-bullseye"></i>
                        <span class="item-title">現在の注力分野</span>
                    </div>
                    <div class="item-content focus-content">
                        ${data.focus_area}
                    </div>
                </div>
            `;
        }
        
        // 全体的な雰囲気
        if (data.mood) {
            const moodIcon = this.getMoodIcon(data.mood);
            detailsHtml += `
                <div class="analysis-item mood">
                    <div class="item-header">
                        <i class="${moodIcon}"></i>
                        <span class="item-title">全体的な雰囲気</span>
                    </div>
                    <div class="item-content mood-content">
                        <span class="mood-badge mood-${data.mood.toLowerCase()}">${data.mood}</span>
                    </div>
                </div>
            `;
        }
        
        // 使用技術
        if (data.technologies && data.technologies.length > 0) {
            detailsHtml += `
                <div class="analysis-item technologies">
                    <div class="item-header">
                        <i class="fas fa-code"></i>
                        <span class="item-title">言及された技術 (${data.technologies.length})</span>
                    </div>
                    <div class="item-content">
                        <div class="tech-tags">
                            ${data.technologies.map(tech => 
                                `<span class="tech-tag">${tech}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 具体的な成果
        if (data.achievements && data.achievements.length > 0) {
            detailsHtml += `
                <div class="analysis-item achievements">
                    <div class="item-header">
                        <i class="fas fa-trophy"></i>
                        <span class="item-title">具体的な成果 (${data.achievements.length})</span>
                    </div>
                    <div class="item-content">
                        <ul class="achievements-list">
                            ${data.achievements.map(achievement => 
                                `<li class="achievement-item">${achievement}</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }
        
        detailsContainer.innerHTML = detailsHtml;
        
        // アニメーション効果を追加
        detailsContainer.classList.add('fade-in');
    }
    
    getMoodIcon(mood) {
        const moodIcons = {
            'ポジティブ': 'fas fa-smile',
            'ニュートラル': 'fas fa-meh',
            'チャレンジング': 'fas fa-fist-raised',
            'ネガティブ': 'fas fa-frown'
        };
        return moodIcons[mood] || 'fas fa-meh';
    }

    showError() {
        if (this.summaryElement) {
            this.summaryElement.innerHTML = `
                <p class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    アクティビティデータの読み込みに失敗しました。しばらく後に再試行されます。
                </p>
            `;
        }

        if (this.lastUpdatedElement) {
            this.lastUpdatedElement.textContent = '最終更新: エラー';
        }

        // 統計値をリセット
        [this.tweetCountElement, this.topicCountElement, this.engagementRateElement].forEach(el => {
            if (el) el.textContent = '--';
        });
    }
}

// Modern refresh function for insights
function refreshInsights() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0deg)';
        }, 500);
    }
    
    // Trigger insights refresh
    const dashboard = window.modernDashboard;
    if (dashboard) {
        dashboard.loadActivity();
    }
}

// DOMContentLoaded event listener for dashboard initialization
document.addEventListener('DOMContentLoaded', () => {
    // モダンアクティビティダッシュボードを初期化
    if (document.getElementById('summaryContent')) {
        window.modernDashboard = new ModernActivityDashboard();
    }
});