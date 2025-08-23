// 新闻RSS管理系统
class NewsManager {
    constructor() {
        this.newsCache = {};
        this.cacheExpiry = 60 * 60 * 1000; // 1小时缓存
        this.customNews = [];
        this.loadCustomNews();
        
        // 中国主流新闻源
        this.newsSources = [
            {
                name: '新华网',
                url: 'http://www.news.cn/politics/news_politics.xml',
                proxy: 'https://api.rss2json.com/v1/api.json?rss_url='
            },
            {
                name: '人民网',
                url: 'http://www.people.com.cn/rss/politics.xml',
                proxy: 'https://api.rss2json.com/v1/api.json?rss_url='
            },
            {
                name: '央视网',
                url: 'https://news.cctv.com/2019/07/gaiban/cmsdatainterface/page/news_1.jsonp',
                type: 'cctv'
            }
        ];
    }

    // 加载自定义新闻
    loadCustomNews() {
        if (window.storageManager) {
            const data = window.storageManager.getAllData();
            this.customNews = data.customNews || [];
        }
    }

    // 保存自定义新闻
    saveCustomNews() {
        if (window.storageManager) {
            const data = window.storageManager.getAllData();
            data.customNews = this.customNews;
            window.storageManager.saveData(data);
        }
    }

    // 获取今日新闻
    async getTodayNews() {
        const today = this.getTodayKey();
        
        // 检查缓存
        if (this.newsCache[today] && 
            Date.now() - this.newsCache[today].timestamp < this.cacheExpiry) {
            return this.newsCache[today].data;
        }

        try {
            // 尝试获取真实新闻
            const news = await this.fetchRealNews();
            
            if (news && news.length > 0) {
                // 缓存新闻数据
                this.newsCache[today] = {
                    data: news,
                    timestamp: Date.now()
                };
                return news;
            }
        } catch (error) {
            console.error('获取真实新闻失败:', error);
        }
        
        // 如果获取失败，返回模拟新闻
        return this.getMockNews();
    }

    // 获取真实新闻（通过代理服务）
    async fetchRealNews() {
        const allNews = [];
        
        for (const source of this.newsSources) {
            try {
                let news = [];
                
                if (source.type === 'cctv') {
                    // 央视网特殊处理
                    news = await this.fetchCCTVNews();
                } else {
                    // RSS源处理
                    news = await this.fetchRSSNews(source);
                }
                
                if (news && news.length > 0) {
                    allNews.push(...news.slice(0, 3)); // 每个源取3条
                }
            } catch (error) {
                console.error(`获取${source.name}新闻失败:`, error);
            }
        }
        
        // 随机选择5条新闻
        return this.shuffleArray(allNews).slice(0, 5);
    }

    // 获取RSS新闻
    async fetchRSSNews(source) {
        try {
            const proxyUrl = source.proxy + encodeURIComponent(source.url);
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'ok' && data.items) {
                return data.items.map(item => ({
                    title: this.cleanText(item.title),
                    description: this.cleanText(item.description || item.content),
                    link: item.link,
                    pubDate: item.pubDate,
                    source: source.name
                }));
            }
        } catch (error) {
            console.error(`RSS获取失败 (${source.name}):`, error);
        }
        
        return [];
    }

    // 获取央视网新闻（模拟，因为实际API可能需要特殊处理）
    async fetchCCTVNews() {
        // 这里可以实现央视网的特殊API调用
        // 由于跨域限制，暂时返回空数组
        return [];
    }

    // 获取模拟新闻
    getMockNews() {
        const mockNews = [
            {
                title: '科技创新推动经济高质量发展',
                description: '近年来，我国在人工智能、5G通信、新能源等领域取得重大突破，为经济发展注入新动力。专家表示，科技创新是推动经济高质量发展的重要引擎。',
                source: '模拟新闻',
                pubDate: new Date().toISOString()
            },
            {
                title: '全国多地气温回升，春意盎然',
                description: '随着冷空气影响减弱，全国多地气温明显回升。气象部门提醒，虽然气温回升，但早晚温差较大，市民外出仍需注意适当增减衣物。',
                source: '模拟新闻',
                pubDate: new Date().toISOString()
            },
            {
                title: '教育部门推进数字化教学改革',
                description: '为适应信息时代发展需求，教育部门积极推进数字化教学改革，通过现代信息技术提升教学质量，让更多学生享受优质教育资源。',
                source: '模拟新闻',
                pubDate: new Date().toISOString()
            },
            {
                title: '健康生活方式受到广泛关注',
                description: '随着人们健康意识的提高，合理饮食、适量运动、规律作息等健康生活方式受到越来越多人的关注和实践。专家建议，保持良好的生活习惯对身心健康都有重要意义。',
                source: '模拟新闻',
                pubDate: new Date().toISOString()
            },
            {
                title: '文化旅游产业蓬勃发展',
                description: '近期，各地文化旅游活动丰富多彩，传统文化与现代旅游相结合，吸引了众多游客。文旅融合发展为地方经济增长提供了新的动力。',
                source: '模拟新闻',
                pubDate: new Date().toISOString()
            }
        ];
        
        // 根据日期选择不同的新闻组合
        const today = new Date().getDate();
        const startIndex = today % mockNews.length;
        const selectedNews = [];
        
        for (let i = 0; i < 3; i++) {
            const index = (startIndex + i) % mockNews.length;
            selectedNews.push(mockNews[index]);
        }
        
        return selectedNews;
    }

    // 清理文本内容
    cleanText(text) {
        if (!text) return '';
        
        // 移除HTML标签
        text = text.replace(/<[^>]*>/g, '');
        
        // 移除多余的空白字符
        text = text.replace(/\s+/g, ' ').trim();
        
        // 限制长度
        if (text.length > 200) {
            text = text.substring(0, 200) + '...';
        }
        
        return text;
    }

    // 数组随机排序
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // 更新新闻显示
    async updateNewsDisplay() {
        const newsContent = document.getElementById('news-content');
        if (!newsContent) return;
        
        try {
            // 显示加载状态
            newsContent.innerHTML = '<div class="news-item"><h3>正在获取今日新闻...</h3><div class="loading"></div></div>';
            
            const news = await this.getTodayNews();
            
            // 清空内容
            newsContent.innerHTML = '';
            
            // 显示新闻
            news.forEach((item, index) => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                newsItem.innerHTML = `
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <div class="news-meta">
                        <span class="news-source">来源: ${item.source}</span>
                        <span class="news-time">${this.formatDate(item.pubDate)}</span>
                    </div>
                `;
                newsContent.appendChild(newsItem);
            });
            
            // 添加自定义新闻
            this.displayCustomNews();
            
        } catch (error) {
            console.error('更新新闻显示失败:', error);
            newsContent.innerHTML = '<div class="news-item"><h3>新闻获取失败</h3><p>请稍后重试或添加家庭事件进行练习。</p></div>';
        }
    }

    // 显示自定义新闻
    displayCustomNews() {
        const newsContent = document.getElementById('news-content');
        if (!newsContent) return;
        
        const todayCustomNews = this.getTodayCustomNews();
        
        todayCustomNews.forEach(item => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item custom-news';
            newsItem.innerHTML = `
                <h3>家庭事件: ${item.title}</h3>
                <p>${item.content}</p>
                <div class="news-meta">
                    <span class="news-source">家庭记录</span>
                    <span class="news-time">${this.formatDate(item.date)}</span>
                </div>
            `;
            newsContent.appendChild(newsItem);
        });
    }

    // 添加自定义新闻/家庭事件
    addCustomNews(title, content) {
        const customNewsItem = {
            id: Date.now().toString(),
            title: title,
            content: content,
            date: new Date().toISOString(),
            type: 'family'
        };
        
        this.customNews.push(customNewsItem);
        this.saveCustomNews();
        
        return customNewsItem;
    }

    // 获取今日自定义新闻
    getTodayCustomNews() {
        const today = this.getTodayKey();
        return this.customNews.filter(item => {
            const itemDate = new Date(item.date).toISOString().split('T')[0];
            return itemDate === today;
        });
    }

    // 删除自定义新闻
    deleteCustomNews(newsId) {
        this.customNews = this.customNews.filter(item => item.id !== newsId);
        this.saveCustomNews();
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return '今天';
        } else if (diffDays === 2) {
            return '昨天';
        } else if (diffDays <= 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }

    // 获取今日日期键
    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    }

    // 生成新闻问题
    generateNewsQuestions(news) {
        const questions = [
            '新闻里说了什么主要内容？',
            '这条新闻发生在什么时候？',
            '新闻中提到了哪些重要信息？',
            '您对这条新闻有什么看法？',
            '这条新闻让您想到了什么？'
        ];
        
        // 根据新闻内容生成特定问题
        const specificQuestions = [];
        
        news.forEach(item => {
            if (item.title.includes('天气') || item.title.includes('气温')) {
                specificQuestions.push('新闻中提到的天气情况是怎样的？');
            }
            if (item.title.includes('科技') || item.title.includes('创新')) {
                specificQuestions.push('新闻中提到了哪些科技发展？');
            }
            if (item.title.includes('教育') || item.title.includes('学校')) {
                specificQuestions.push('新闻中关于教育的内容是什么？');
            }
            if (item.title.includes('健康') || item.title.includes('医疗')) {
                specificQuestions.push('新闻中提到的健康建议是什么？');
            }
        });
        
        return [...questions, ...specificQuestions];
    }

    // 评估新闻回答
    evaluateNewsAnswer(answer, news) {
        if (!answer || answer.trim().length < 10) {
            return {
                score: 20,
                feedback: '回答太简短，请尝试用更多的话来描述新闻内容。'
            };
        }
        
        let score = 50; // 基础分
        const answerLower = answer.toLowerCase();
        
        // 检查是否包含新闻关键词
        news.forEach(item => {
            const keywords = this.extractKeywords(item.title + ' ' + item.description);
            keywords.forEach(keyword => {
                if (answerLower.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            });
        });
        
        // 根据回答长度调整分数
        if (answer.length > 50) score += 10;
        if (answer.length > 100) score += 10;
        
        // 限制最高分数
        score = Math.min(score, 100);
        
        let feedback = '';
        if (score >= 80) {
            feedback = '回答很好！您很好地理解了新闻内容。';
        } else if (score >= 60) {
            feedback = '回答不错，您抓住了一些重要信息。';
        } else if (score >= 40) {
            feedback = '回答基本正确，可以尝试回忆更多细节。';
        } else {
            feedback = '请再仔细想想新闻的主要内容。';
        }
        
        return { score, feedback };
    }

    // 提取关键词
    extractKeywords(text) {
        const keywords = [];
        const commonWords = ['的', '了', '在', '是', '有', '和', '与', '等', '及', '或', '但', '而', '也', '都', '很', '更', '最'];
        
        // 简单的中文分词（基于常见词汇）
        const words = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
        
        words.forEach(word => {
            if (word.length >= 2 && !commonWords.includes(word)) {
                keywords.push(word);
            }
        });
        
        return [...new Set(keywords)]; // 去重
    }

    // 清除缓存
    clearCache() {
        this.newsCache = {};
    }
}

// 创建全局新闻管理器实例
window.newsManager = new NewsManager();

// 加载新闻的全局函数
window.loadNews = async function() {
    if (window.newsManager) {
        await window.newsManager.updateNewsDisplay();
    }
};

// 添加自定义新闻的全局函数
window.addCustomNews = function() {
    const title = prompt('请输入家庭事件标题:');
    if (!title) return;
    
    const content = prompt('请描述这个家庭事件:');
    if (!content) return;
    
    if (window.newsManager) {
        window.newsManager.addCustomNews(title, content);
        window.newsManager.updateNewsDisplay();
        alert('家庭事件添加成功！');
    }
};

// 提交新闻回答的全局函数
window.submitNewsAnswer = async function() {
    const answerTextarea = document.getElementById('news-answer');
    if (!answerTextarea) return;
    
    const answer = answerTextarea.value.trim();
    if (!answer) {
        alert('请先输入您的回答。');
        return;
    }
    
    if (window.newsManager && window.storageManager) {
        // 获取当前新闻
        const news = await window.newsManager.getTodayNews();
        
        // 评估回答
        const evaluation = window.newsManager.evaluateNewsAnswer(answer, news);
        
        // 保存回答
        window.storageManager.saveNewsAnswer(answer);
        
        // 记录分数
        window.storageManager.recordGameScore('news-recall', evaluation.score, {
            answer: answer,
            feedback: evaluation.feedback
        });
        
        // 显示反馈
        alert(`回答已保存！\n得分: ${evaluation.score}分\n${evaluation.feedback}`);
        
        // 清空输入框
        answerTextarea.value = '';
    }
};

// 导出用于其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsManager;
}
