// 主应用程序控制器
class AlzheimerTrainingApp {
    constructor() {
        this.currentSection = 'orientation';
        this.isInitialized = false;
        this.init();
    }

    // 初始化应用
    async init() {
        if (this.isInitialized) return;
        
        try {
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }

    // 初始化应用程序
    async initializeApp() {
        // 更新日期时间显示
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);

        // 初始化定向练习
        this.initializeOrientation();

        // 加载用户设置
        this.loadUserSettings();

        // 尝试获取当前位置
        this.getCurrentLocation();

        // 显示默认部分
        this.showSection('orientation');

        // 标记为已初始化
        this.isInitialized = true;

        console.log('阿兹海默症记忆训练系统已启动');
    }

    // 更新日期时间显示
    updateDateTime() {
        // 只保留内部时间跟踪，不显示在界面上
        this.currentDateTime = new Date();
    }

    // 获取当前位置
    getCurrentLocation() {
        // 检查浏览器是否支持地理定位
        if (!navigator.geolocation) {
            console.log('浏览器不支持地理定位功能');
            return;
        }

        // 获取当前位置
        navigator.geolocation.getCurrentPosition(
            // 成功回调
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`获取到位置信息: 纬度 ${latitude}, 经度 ${longitude}`);
                
                // 使用逆地理编码获取城市信息
                this.reverseGeocode(latitude, longitude);
            },
            // 错误回调
            (error) => {
                console.error('获取位置信息失败:', error);
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        console.log('用户拒绝了地理定位请求');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log('位置信息不可用');
                        break;
                    case error.TIMEOUT:
                        console.log('获取位置信息超时');
                        break;
                    default:
                        console.log('获取位置信息时发生未知错误');
                        break;
                }
            },
            {
                // 位置选项
                enableHighAccuracy: true,  // 启用高精度
                timeout: 10000,            // 超时时间10秒
                maximumAge: 300000         // 缓存时间5分钟
            }
        );
    }

    // 逆地理编码获取城市信息
    async reverseGeocode(latitude, longitude) {
        try {
            // 使用免费的地理编码服务 (Nominatim)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('逆地理编码结果:', data);
            
            // 提取城市信息
            const address = data.address;
            let city = '';
            
            // 尝试从不同字段获取城市信息
            if (address.city) {
                city = address.city;
            } else if (address.town) {
                city = address.town;
            } else if (address.village) {
                city = address.village;
            } else if (address.county) {
                city = address.county;
            } else {
                // 如果没有城市信息，使用国家信息
                city = address.country || '未知位置';
            }
            
            // 保存位置信息
            this.currentLocation = {
                latitude: latitude,
                longitude: longitude,
                city: city,
                fullAddress: data.display_name
            };
            
            console.log(`当前位置: ${city}`);
        } catch (error) {
            console.error('逆地理编码失败:', error);
        }
    }

    // 初始化定向练习得分系统
    initializeOrientationScoring() {
        this.orientationScore = {
            date: false,
            city: false,
            daynight: false,
            total: 0
        };
        this.updateOrientationScoreDisplay();
    }

    // 更新定向练习得分显示
    updateOrientationScoreDisplay() {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = this.orientationScore.total;
        }
    }

    // 验证日期答案（新的分离输入格式）
    validateDateAnswer(yearInput, monthInput, dayInput, weekdayInput) {
        const now = this.currentDateTime || new Date();
        const correctYear = now.getFullYear();
        const correctMonth = now.getMonth() + 1;
        const correctDate = now.getDate();
        const correctWeekday = now.getDay();

        // 验证各个部分
        const yearMatch = parseInt(yearInput) === correctYear;
        const monthMatch = parseInt(monthInput) === correctMonth;
        const dateMatch = parseInt(dayInput) === correctDate;
        const weekdayMatch = parseInt(weekdayInput) === correctWeekday;

        // 计算得分（年月日星期各占25%）
        let score = 0;
        if (yearMatch) score += 0.25;
        if (monthMatch) score += 0.25;
        if (dateMatch) score += 0.25;
        if (weekdayMatch) score += 0.25;

        return {
            correct: score >= 0.75, // 75%以上算正确
            score: score,
            feedback: this.generateDateFeedback(yearMatch, monthMatch, dateMatch, weekdayMatch, now)
        };
    }

    // 生成日期反馈
    generateDateFeedback(yearMatch, monthMatch, dateMatch, weekdayMatch, now) {
        const correctAnswer = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${this.getWeekdayName(now.getDay())}`;
        
        if (yearMatch && monthMatch && dateMatch && weekdayMatch) {
            return `✅ 完全正确！今天是${correctAnswer}`;
        } else {
            let feedback = `部分正确。正确答案是：${correctAnswer}\n`;
            if (!yearMatch) feedback += '• 年份不正确\n';
            if (!monthMatch) feedback += '• 月份不正确\n';
            if (!dateMatch) feedback += '• 日期不正确\n';
            if (!weekdayMatch) feedback += '• 星期不正确\n';
            return feedback;
        }
    }

    // 验证城市答案
    validateCityAnswer(userInput) {
        // 默认城市
        let correctCity = '北京';
        
        // 如果有自动获取的位置信息，优先使用自动获取的位置
        if (this.currentLocation) {
            correctCity = this.currentLocation.city || correctCity;
        }
        
        // 清理用户输入
        const userCity = userInput.trim();
        
        // 检查是否匹配（支持部分匹配，如"北京"和"北京市"）
        const isCorrect = userCity && (
            userCity === correctCity ||
            userCity.includes(correctCity) ||
            correctCity.includes(userCity)
        );
        
        return {
            correct: isCorrect,
            score: isCorrect ? 1 : 0,
            feedback: isCorrect ?
                `✅ 正确！您现在身处${correctCity}` :
                `❌ 不正确。${this.currentLocation ? '根据自动定位' : '默认'}，您现在身处${correctCity}。`
        };
    }

    // 验证昼夜答案
    validateDayNightAnswer(userChoice) {
        const now = this.currentDateTime || new Date();
        const hour = now.getHours();
        const isDay = hour >= 6 && hour < 18;
        const correctAnswer = isDay ? 'day' : 'night';
        
        const isCorrect = userChoice === correctAnswer;
        
        return {
            correct: isCorrect,
            score: isCorrect ? 1 : 0,
            feedback: isCorrect ? 
                `✅ 正确！现在是${isDay ? '☀️ 白昼' : '🌙 黑夜'}` : 
                `❌ 不正确。现在是${isDay ? '☀️ 白昼' : '🌙 黑夜'}`
        };
    }

    // 获取星期名称
    getWeekdayName(dayIndex) {
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        return weekdays[dayIndex];
    }

    // 初始化定向练习
    initializeOrientation() {
        // 初始化得分系统
        this.initializeOrientationScoring();
    }

    // 加载用户设置
    loadUserSettings() {
        if (!window.storageManager) return;

        const settings = window.storageManager.getSettings();
        
        // 应用字体大小设置
        this.applyFontSize(settings.fontSize || 'medium');
        
        // 应用高对比度设置
        if (settings.highContrast) {
            document.body.classList.add('high-contrast');
        }
    }

    // 应用字体大小
    applyFontSize(fontSize) {
        document.body.className = document.body.className.replace(/font-\w+/g, '');
        document.body.classList.add(`font-${fontSize}`);
    }

    // 显示指定部分
    showSection(sectionId) {
        // 隐藏所有部分
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // 移除所有导航按钮的活动状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 显示指定部分
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // 激活对应的导航按钮
        const navBtn = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        this.currentSection = sectionId;

        // 根据部分执行特定初始化
        switch (sectionId) {
            case 'orientation':
                this.initializeOrientation();
                break;
            case 'memory-games':
                // 游戏部分在用户选择时加载
                break;
            case 'summary':
                this.updateSummaryDisplay();
                break;
            case 'caregiver':
                this.initializeCaregiverInterface();
                break;
        }

        // 记录访问
        this.recordSectionVisit(sectionId);
    }

    // 记录部分访问
    recordSectionVisit(sectionId) {
        if (window.storageManager) {
            const progress = window.storageManager.getTodayProgress();
            if (sectionId === 'photos') progress.photos = true;
            window.storageManager.saveTodayProgress(progress);
        }
    }

    // 更新总结显示
    updateSummaryDisplay() {
        this.updateTrainingProgress();
        this.updateDetailedScoreBreakdown();
        this.updatePerformanceAnalysis();
        this.loadSavedFeedback();
    }

    // 加载已保存的反馈
    loadSavedFeedback() {
        if (!window.storageManager) return;
        
        const todayFeedback = window.storageManager.getTodayFeedback();
        
        // 恢复情绪选择
        if (todayFeedback.emotion) {
            const emotionBtn = document.querySelector(`[data-emotion="${todayFeedback.emotion}"]`);
            if (emotionBtn) {
                emotionBtn.classList.add('selected');
                this.showEmotionFeedback(todayFeedback.emotion);
            }
        }
        
        // 恢复评分选择
        if (todayFeedback.ratings) {
            Object.keys(todayFeedback.ratings).forEach(category => {
                const value = todayFeedback.ratings[category];
                const ratingBtns = document.querySelectorAll(`[onclick*="setRating('${category}'"]`);
                ratingBtns.forEach(btn => {
                    if (btn.onclick.toString().includes(`'${value}'`)) {
                        btn.classList.add('selected');
                    }
                });
            });
        }
        
        // 恢复有帮助的活动选择
        if (todayFeedback.helpfulActivity) {
            const activityBtn = document.querySelector(`[onclick*="setHelpfulActivity('${todayFeedback.helpfulActivity}'"]`);
            if (activityBtn) {
                activityBtn.classList.add('selected');
            }
        }
        
        // 恢复文本反馈
        if (todayFeedback.textFeedback) {
            const textarea = document.getElementById('daily-feedback');
            if (textarea) {
                textarea.value = todayFeedback.textFeedback;
            }
        }
    }

    // 显示情绪反馈
    showEmotionFeedback(emotion) {
        const feedbackDiv = document.getElementById('emotion-feedback');
        if (!feedbackDiv) return;
        
        const feedbackMessages = {
            excellent: '太棒了！您今天的状态非常好！',
            good: '很好！保持这种积极的心态！',
            neutral: '今天感觉一般，这很正常。',
            tired: '感觉有点累？记得适当休息。',
            difficult: '遇到困难了？不要担心，慢慢来。'
        };
        
        feedbackDiv.innerHTML = `
            <div class="emotion-response">
                <p>${feedbackMessages[emotion] || '感谢您分享今天的感受。'}</p>
            </div>
        `;
    }

    // 更新训练进度
    updateTrainingProgress() {
        const progressDiv = document.getElementById('training-progress');
        if (!progressDiv || !window.storageManager) return;

        const progress = window.storageManager.getTodayProgress();
        const memoryGamesCompleted = this.checkMemoryGamesCompleted();
        const memoryGamesScore = this.calculateMemoryGamesScore();
        
        const activities = [
            { key: 'orientation', name: '定向练习', completed: progress.orientation, score: progress.orientationScore || 0, maxScore: 3 },
            { key: 'memoryGames', name: '记忆训练', completed: memoryGamesCompleted, score: memoryGamesScore, maxScore: 100 }
        ];

        const completedCount = activities.filter(a => a.completed).length;
        const totalCount = activities.length;
        const completionRate = Math.round((completedCount / totalCount) * 100);

        progressDiv.innerHTML = `
            <div class="progress-overview">
                <div class="completion-circle">
                    <div class="circle-progress" style="--progress: ${completionRate}%">
                        <span class="progress-text">${completionRate}%</span>
                    </div>
                </div>
                <div class="completion-details">
                    <h4>今日完成度</h4>
                    <p>已完成 ${completedCount} / ${totalCount} 项训练</p>
                </div>
            </div>
            <div class="activity-list">
                ${activities.map(activity => `
                    <div class="activity-item ${activity.completed ? 'completed' : 'pending'}">
                        <div class="activity-info">
                            <span class="activity-icon">${activity.completed ? '✅' : '⏳'}</span>
                            <span class="activity-name">${activity.name}</span>
                        </div>
                        <div class="activity-score">
                            ${activity.completed ? 
                                `<span class="score">${activity.score}/${activity.maxScore}</span>` : 
                                '<span class="pending-text">未完成</span>'
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 检查记忆游戏是否完成
    checkMemoryGamesCompleted() {
        if (!window.storageManager) return false;
        
        const today = window.storageManager.getTodayKey();
        const data = window.storageManager.getAllData();
        
        // 检查今天是否有游戏得分记录
        return data.gameScores && data.gameScores[today] && 
               Object.keys(data.gameScores[today]).length > 0;
    }

    // 计算记忆游戏总分
    calculateMemoryGamesScore() {
        if (!window.storageManager) return 0;
        
        const today = window.storageManager.getTodayKey();
        const data = window.storageManager.getAllData();
        
        // 从gameScores中获取今天的得分
        if (!data.gameScores || !data.gameScores[today]) return 0;
        
        const todayScores = data.gameScores[today];
        let totalScore = 0;
        let scoreCount = 0;
        
        // 计算所有游戏的平均分
        Object.values(todayScores).forEach(gameScores => {
            gameScores.forEach(scoreRecord => {
                totalScore += scoreRecord.score || 0;
                scoreCount++;
            });
        });
        
        return scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    }

    // 更新详细得分分解
    updateDetailedScoreBreakdown() {
        const breakdownDiv = document.getElementById('detailed-score-breakdown');
        if (!breakdownDiv || !window.storageManager) return;

        const progress = window.storageManager.getTodayProgress();
        
        // 定向练习详细得分
        const orientationDetails = this.getOrientationDetails();
        
        // 记忆游戏详细得分
        const memoryGameDetails = this.getMemoryGameDetails();

        breakdownDiv.innerHTML = `
            <div class="score-breakdown">
                <div class="score-category">
                    <h4>定向练习 (${orientationDetails.totalScore}/3)</h4>
                    <div class="score-items">
                        ${orientationDetails.items.map(item => `
                            <div class="score-item ${item.completed ? 'completed' : 'incomplete'}">
                                <span class="item-name">${item.name}</span>
                                <span class="item-score">${item.completed ? '✓' : '✗'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="score-category">
                    <h4>记忆训练 (平均分: ${memoryGameDetails.averageScore})</h4>
                    <div class="score-items">
                        ${memoryGameDetails.games.map(game => `
                            <div class="score-item completed">
                                <span class="item-name">${game.name}</span>
                                <span class="item-score">${game.score}分</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 获取定向练习详情
    getOrientationDetails() {
        // 优先从持久化存储获取数据
        if (window.storageManager) {
            const storedDetails = window.storageManager.getOrientationDetails();
            if (storedDetails) {
                return {
                    totalScore: storedDetails.total,
                    items: [
                        { name: '日期时间', completed: storedDetails.date },
                        { name: '所在城市', completed: storedDetails.city },
                        { name: '昼夜判断', completed: storedDetails.daynight }
                    ]
                };
            }
        }
        
        // 如果没有存储数据，使用会话数据作为后备
        const score = this.orientationScore || { date: false, city: false, daynight: false, total: 0 };
        return {
            totalScore: score.total,
            items: [
                { name: '日期时间', completed: score.date },
                { name: '所在城市', completed: score.city },
                { name: '昼夜判断', completed: score.daynight }
            ]
        };
    }

    // 获取记忆游戏详情
    getMemoryGameDetails() {
        if (!window.storageManager) return { averageScore: 0, games: [] };
        
        const today = window.storageManager.getTodayKey();
        const data = window.storageManager.getAllData();
        
        const gameNames = {
            'number-sequence': '数字序列复述',
            'word-recall': '词语回忆',
            'picture-matching': '图片配对',
            'categorization': '分类游戏'
        };
        
        const games = [];
        let totalScore = 0;
        let scoreCount = 0;
        
        // 从gameScores中获取今天的游戏详情
        if (data.gameScores && data.gameScores[today]) {
            const todayScores = data.gameScores[today];
            
            Object.keys(todayScores).forEach(gameType => {
                const gameScores = todayScores[gameType];
                if (gameScores.length > 0) {
                    // 取最新的得分
                    const latestScore = gameScores[gameScores.length - 1].score;
                    games.push({
                        name: gameNames[gameType] || gameType,
                        score: latestScore
                    });
                    totalScore += latestScore;
                    scoreCount++;
                }
            });
        }
        
        const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
        
        return {
            averageScore,
            games
        };
    }

    // 更新表现分析
    updatePerformanceAnalysis() {
        const analysisDiv = document.getElementById('performance-summary');
        if (!analysisDiv || !window.storageManager) return;

        const progress = window.storageManager.getTodayProgress();
        const orientationScore = progress.orientationScore || 0;
        const memoryScore = this.calculateMemoryGamesScore();
        
        // 生成分析报告
        const analysis = this.generatePerformanceAnalysis(orientationScore, memoryScore, progress);
        
        analysisDiv.innerHTML = `
            <div class="performance-summary">
                <div class="performance-highlights">
                    <div class="highlight-item ${analysis.orientation.level}">
                        <h5>定向能力</h5>
                        <div class="highlight-score">${analysis.orientation.score}/3</div>
                        <div class="highlight-text">${analysis.orientation.text}</div>
                    </div>
                    <div class="highlight-item ${analysis.memory.level}">
                        <h5>记忆能力</h5>
                        <div class="highlight-score">${analysis.memory.score}分</div>
                        <div class="highlight-text">${analysis.memory.text}</div>
                    </div>
                </div>
                <div class="improvement-suggestions">
                    <h5>改进建议</h5>
                    <ul>
                        ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // 生成表现分析
    generatePerformanceAnalysis(orientationScore, memoryScore, progress) {
        const analysis = {
            orientation: {
                score: orientationScore,
                level: orientationScore >= 3 ? 'excellent' : orientationScore >= 2 ? 'good' : 'needs-improvement',
                text: orientationScore >= 3 ? '表现优秀' : orientationScore >= 2 ? '表现良好' : '需要加强'
            },
            memory: {
                score: memoryScore,
                level: memoryScore >= 90 ? 'excellent' : memoryScore >= 70 ? 'good' : 'needs-improvement',
                text: memoryScore >= 90 ? '表现优秀' : memoryScore >= 70 ? '表现良好' : '需要加强'
            },
            suggestions: []
        };

        // 生成建议
        if (orientationScore < 3) {
            analysis.suggestions.push('建议每天练习定向练习，加强对时间、地点的认知');
        }
        if (memoryScore < 70) {
            analysis.suggestions.push('建议增加记忆训练的频率，从简单难度开始');
        }
        if (progress.memoryGames.length < 2) {
            analysis.suggestions.push('建议尝试更多种类的记忆训练游戏');
        }
        if (analysis.suggestions.length === 0) {
            analysis.suggestions.push('继续保持良好的训练习惯！');
        }

        return analysis;
    }


    // 初始化照护者界面
    initializeCaregiverInterface() {
        this.loadCaregiverSettings();
        this.updateProgressReports();
    }

    // 加载照护者设置
    loadCaregiverSettings() {
        if (!window.storageManager) return;

        const settings = window.storageManager.getSettings();
        
        // 填充设置表单
        const difficultySelect = document.getElementById('difficulty-level');
        const fontSizeSelect = document.getElementById('font-size');

        if (difficultySelect) difficultySelect.value = settings.difficulty || 'medium';
        if (fontSizeSelect) fontSizeSelect.value = settings.fontSize || 'medium';
    }

    // 更新进度报告
    updateProgressReports() {
        const chartsDiv = document.getElementById('progress-charts');
        if (!chartsDiv || !window.storageManager) return;

        const stats = window.storageManager.getStatistics();
        const history = window.storageManager.getProgressHistory(30);

        chartsDiv.innerHTML = `
            <div class="stats-overview">
                <div class="stat-card">
                    <h4>总训练次数</h4>
                    <div class="stat-number">${stats.totalSessions}</div>
                </div>
                <div class="stat-card">
                    <h4>平均得分</h4>
                    <div class="stat-number">${stats.averageScore}分</div>
                </div>
                <div class="stat-card">
                    <h4>完成活动</h4>
                    <div class="stat-number">${stats.completedActivities}</div>
                </div>
            </div>
            <div class="progress-timeline">
                <h4>30天进度趋势</h4>
                <div class="timeline-chart">
                    ${history.map(day => `
                        <div class="timeline-day" title="${day.date}: ${day.completionRate}%完成, ${day.averageScore}分">
                            <div class="day-bar" style="height: ${day.completionRate}%"></div>
                            <div class="day-emotion">${this.getEmotionIcon(day.emotion)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 获取情绪图标
    getEmotionIcon(emotion) {
        const icons = {
            happy: '😊',
            neutral: '😐',
            tired: '😴',
            confused: '😕'
        };
        return icons[emotion] || '😐';
    }
}


// 全局函数定义
window.showSection = function(sectionId) {
    if (window.app) {
        window.app.showSection(sectionId);
    }
};

window.saveLocation = function() {
    const input = document.getElementById('location-input');
    const location = input?.value.trim();
    
    if (!location) {
        alert('请输入位置信息。');
        return;
    }
    
    if (window.storageManager) {
        window.storageManager.saveLocation(location);
        const savedLocationDiv = document.getElementById('saved-location');
        if (savedLocationDiv) {
            savedLocationDiv.textContent = location;
            savedLocationDiv.style.display = 'block';
        }
        input.value = '';
        alert('位置信息已保存！');
    }
};

window.setEmotion = function(emotion) {
    // 移除其他按钮的选中状态
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 选中当前按钮
    event.target.classList.add('selected');
    
    // 显示情绪反馈
    if (window.app) {
        window.app.showEmotionFeedback(emotion);
    }
    
    // 保存情绪
    if (window.storageManager) {
        window.storageManager.saveEmotion(emotion);
    }
};

window.setRating = function(category, value) {
    // 移除同类别其他按钮的选中状态
    document.querySelectorAll(`[onclick*="setRating('${category}'"]`).forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 选中当前按钮
    event.target.classList.add('selected');
    
    // 保存评分
    if (window.storageManager) {
        window.storageManager.saveRating(category, value);
    }
};

window.setHelpfulActivity = function(activity) {
    // 移除其他按钮的选中状态
    document.querySelectorAll(`[onclick*="setHelpfulActivity"]`).forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 选中当前按钮
    event.target.classList.add('selected');
    
    // 保存有帮助的活动
    if (window.storageManager) {
        window.storageManager.saveHelpfulActivity(activity);
    }
};

window.saveDailyFeedback = function() {
    const feedbackTextarea = document.getElementById('daily-feedback');
    const feedback = feedbackTextarea?.value.trim();
    
    // 收集所有反馈数据
    const selectedEmotion = document.querySelector('.emotion-btn.selected')?.dataset.emotion;
    const selectedRatings = {};
    const selectedActivity = document.querySelector('[onclick*="setHelpfulActivity"].selected')?.onclick.toString().match(/'([^']+)'/)?.[1];
    
    // 收集评分数据
    ['difficulty', 'satisfaction'].forEach(category => {
        const selectedRating = document.querySelector(`[onclick*="setRating('${category}',"].selected`);
        if (selectedRating) {
            const match = selectedRating.onclick.toString().match(new RegExp(`setRating\\('${category}',\\s*(\\d+)\\)`));
            if (match) {
                selectedRatings[category] = parseInt(match[1]);
            }
        }
    });
    
    // 保存完整的反馈数据
    if (window.storageManager) {
        window.storageManager.saveDailyFeedback({
            emotion: selectedEmotion,
            ratings: selectedRatings,
            helpfulActivity: selectedActivity,
            textFeedback: feedback,
            timestamp: new Date().toISOString()
        });
        
        alert('今日反馈已保存！感谢您的参与！');
        
        // 标记总结已完成
        const progress = window.storageManager.getTodayProgress();
        progress.summary = true;
        window.storageManager.saveTodayProgress(progress);
    }
};

window.generateSummaryReport = function() {
    if (!window.storageManager) return;
    
    const progress = window.storageManager.getTodayProgress();
    const feedback = window.storageManager.getTodayFeedback();
    const orientationScore = progress.orientationScore || 0;
    const memoryScore = window.app?.calculateMemoryGamesScore() || 0;
    
    // 生成总结报告
    const report = {
        date: new Date().toLocaleDateString('zh-CN'),
        completion: {
            orientation: progress.orientation,
            memoryGames: window.app?.checkMemoryGamesCompleted() || false
        },
        scores: {
            orientation: orientationScore,
            memory: memoryScore
        },
        feedback: feedback,
        recommendations: window.app?.generatePerformanceAnalysis(orientationScore, memoryScore, progress)?.suggestions || []
    };
    
    // 显示报告
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    if (modal && modalBody) {
        modalBody.innerHTML = `
            <h3>今日训练总结报告</h3>
            <div class="report-content">
                <div class="report-section">
                    <h4>训练完成情况</h4>
                    <p>定向练习: ${report.completion.orientation ? '✅ 已完成' : '❌ 未完成'}</p>
                    <p>记忆训练: ${report.completion.memoryGames ? '✅ 已完成' : '❌ 未完成'}</p>
                </div>
                
                <div class="report-section">
                    <h4>得分情况</h4>
                    <p>定向练习得分: ${report.scores.orientation}/3</p>
                    <p>记忆训练平均分: ${report.scores.memory}分</p>
                </div>
                
                <div class="report-section">
                    <h4>今日感受</h4>
                    <p>训练难度: ${this.getDifficultyText(report.feedback.ratings?.difficulty)}</p>
                    <p>还有想说的: ${report.feedback.textFeedback || '无'}</p>
                </div>
                
                <div class="report-section">
                    <h4>改进建议</h4>
                    <ul>
                        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div class="report-actions">
                <button onclick="window.print()">打印报告</button>
                <button onclick="shareSummaryReport()">分享</button>
                <button onclick="closeModal()">关闭</button>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }
};

// 辅助函数
window.getEmotionText = function(emotion) {
    const emotions = {
        excellent: '非常好',
        good: '很好',
        neutral: '一般',
        tired: '有点累',
        difficult: '有点困难'
    };
    return emotions[emotion] || '未选择';
};

window.getDifficultyText = function(difficulty) {
    const difficulties = {
        1: '太简单',
        2: '刚好',
        3: '有点难',
        4: '很困难'
    };
    return difficulties[difficulty] || '未评价';
};

window.getSatisfactionText = function(satisfaction) {
    const satisfactions = {
        1: '不满意',
        2: '一般',
        3: '满意',
        4: '很满意'
    };
    return satisfactions[satisfaction] || '未评价';
};

window.showTab = function(tabName) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // 移除所有标签按钮的活动状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示指定标签
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    
    // 激活对应按钮
    event.target.classList.add('active');
};

window.saveSettings = function() {
    const difficulty = document.getElementById('difficulty-level')?.value;
    const fontSize = document.getElementById('font-size')?.value;
    
    if (window.storageManager) {
        window.storageManager.saveSettings({
            difficulty: difficulty,
            fontSize: fontSize
        });
        
        // 应用设置
        if (window.app) {
            window.app.applyFontSize(fontSize);
        }
        
        // 更新游戏难度
        if (window.memoryGames) {
            window.memoryGames.updateDifficulty(difficulty);
        }
        
        alert('设置已保存！');
    }
};

window.exportData = function(format) {
    if (!window.storageManager) return;
    
    const data = window.storageManager.exportData();
    const today = new Date().toISOString().split('T')[0];
    
    switch (format.toLowerCase()) {
        case 'pdf':
            exportAsPDF(data, today);
            break;
        case 'excel':
            exportAsExcel(data, today);
            break;
        default: // json
            exportAsJSON(data, today);
    }
};

function exportAsJSON(data, date) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `alzheimer_training_data_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('JSON数据导出成功！');
}

function exportAsPDF(data, date) {
    try {
        // 检查jsPDF是否已加载
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            // 如果jsPDF未加载，回退到文本文件
            const textContent = JSON.stringify(JSON.parse(data), null, 2);
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `alzheimer_training_data_${date}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('PDF导出功能需要额外的库支持。已导出为文本文件。');
            return;
        }
        
        // 使用jsPDF创建PDF
        const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        const doc = new jsPDF();
        
        // 添加标题
        doc.setFontSize(16);
        doc.text('阿兹海默症记忆训练系统 - 数据导出报告', 10, 10);
        doc.setFontSize(12);
        doc.text(`导出日期: ${date}`, 10, 20);
        
        // 添加数据内容
        const jsonData = JSON.parse(data);
        let yPosition = 30;
        
        // 添加统计信息
        if (jsonData.statistics) {
            doc.setFontSize(14);
            doc.text('统计信息', 10, yPosition);
            yPosition += 10;
            doc.setFontSize(12);
            
            for (const key in jsonData.statistics) {
                if (jsonData.statistics.hasOwnProperty(key)) {
                    const value = jsonData.statistics[key];
                    doc.text(`${key}: ${value}`, 15, yPosition);
                    yPosition += 7;
                }
            }
            yPosition += 5;
        }
        
        // 添加设置信息
        if (jsonData.settings) {
            doc.setFontSize(14);
            doc.text('设置信息', 10, yPosition);
            yPosition += 10;
            doc.setFontSize(12);
            
            for (const key in jsonData.settings) {
                if (jsonData.settings.hasOwnProperty(key)) {
                    const value = jsonData.settings[key];
                    doc.text(`${key}: ${value}`, 15, yPosition);
                    yPosition += 7;
                }
            }
            yPosition += 5;
        }
        
        // 添加进度信息摘要
        if (jsonData.dailyProgress) {
            doc.setFontSize(14);
            doc.text('训练进度摘要', 10, yPosition);
            yPosition += 10;
            doc.setFontSize(12);
            
            const progressEntries = Object.entries(jsonData.dailyProgress);
            // 只显示最近7天的进度
            const recentProgress = progressEntries.slice(-7);
            
            for (const [date, progress] of recentProgress) {
                doc.text(`日期: ${date}`, 15, yPosition);
                yPosition += 7;
                
                if (progress.orientation !== undefined) {
                    doc.text(`  定向练习: ${progress.orientation ? '已完成' : '未完成'}`, 20, yPosition);
                    yPosition += 7;
                }
                
                if (progress.memoryGames && progress.memoryGames.length > 0) {
                    doc.text(`  记忆训练: 已完成 (${progress.memoryGames.length} 个游戏)`, 20, yPosition);
                    yPosition += 7;
                } else {
                    doc.text(`  记忆训练: 未完成`, 20, yPosition);
                    yPosition += 7;
                }
                
                yPosition += 3; // 日期间的间隔
                
                // 如果页面快满了，添加新页面
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 10;
                }
            }
        }
        
        // 保存PDF
        doc.save(`alzheimer_training_data_${date}.pdf`);
        alert('PDF报告导出成功！');
    } catch (error) {
        console.error('PDF导出失败:', error);
        alert('PDF导出失败，请稍后重试。');
    }
}

function exportAsExcel(data, date) {
    try {
        // 检查SheetJS是否已加载
        if (typeof XLSX === 'undefined') {
            // 如果SheetJS未加载，回退到CSV文件
            const jsonData = JSON.parse(data);
            let csvContent = '';
            
            // 简单的JSON到CSV转换
            csvContent += 'Key,Value\n';
            for (const key in jsonData) {
                if (jsonData.hasOwnProperty(key)) {
                    const value = typeof jsonData[key] === 'object' ?
                        JSON.stringify(jsonData[key]) :
                        jsonData[key];
                    csvContent += `${key},"${value}"\n`;
                }
            }
            
            // 创建Blob用于下载
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `alzheimer_training_data_${date}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Excel导出功能需要额外的库支持。已导出为CSV文件。');
            return;
        }
        
        // 使用SheetJS创建Excel文件
        const jsonData = JSON.parse(data);
        const workbook = XLSX.utils.book_new();
        
        // 创建统计数据工作表
        if (jsonData.statistics) {
            const statsArray = [];
            for (const key in jsonData.statistics) {
                if (jsonData.statistics.hasOwnProperty(key)) {
                    statsArray.push({ 项目: key, 值: jsonData.statistics[key] });
                }
            }
            const statsWorksheet = XLSX.utils.json_to_sheet(statsArray);
            XLSX.utils.book_append_sheet(workbook, statsWorksheet, '统计数据');
        }
        
        // 创建设置数据工作表
        if (jsonData.settings) {
            const settingsArray = [];
            for (const key in jsonData.settings) {
                if (jsonData.settings.hasOwnProperty(key)) {
                    settingsArray.push({ 设置项: key, 值: jsonData.settings[key] });
                }
            }
            const settingsWorksheet = XLSX.utils.json_to_sheet(settingsArray);
            XLSX.utils.book_append_sheet(workbook, settingsWorksheet, '设置数据');
        }
        
        // 创建进度数据工作表
        if (jsonData.dailyProgress) {
            const progressArray = [];
            for (const date in jsonData.dailyProgress) {
                if (jsonData.dailyProgress.hasOwnProperty(date)) {
                    const progress = jsonData.dailyProgress[date];
                    progressArray.push({
                        日期: date,
                        定向练习: progress.orientation ? '已完成' : '未完成',
                        记忆训练游戏数: progress.memoryGames ? progress.memoryGames.length : 0,
                        照片回忆: progress.photos ? '已完成' : '未完成',
                        总结报告: progress.summary ? '已完成' : '未完成'
                    });
                }
            }
            const progressWorksheet = XLSX.utils.json_to_sheet(progressArray);
            XLSX.utils.book_append_sheet(workbook, progressWorksheet, '训练进度');
        }
        
        // 保存Excel文件
        XLSX.writeFile(workbook, `alzheimer_training_data_${date}.xlsx`);
        alert('Excel数据导出成功！');
    } catch (error) {
        console.error('Excel导出失败:', error);
        alert('Excel导出失败，请稍后重试。');
    }
}

window.clearData = function() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        if (window.storageManager) {
            window.storageManager.clearAllData();
            alert('所有数据已清除！');
            location.reload();
        }
    }
};

window.closeModal = function() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

window.shareSummaryReport = function() {
    if (!window.storageManager) return;
    
    const progress = window.storageManager.getTodayProgress();
    const feedback = window.storageManager.getTodayFeedback();
    const orientationScore = progress.orientationScore || 0;
    const memoryScore = window.app?.calculateMemoryGamesScore() || 0;
    
    // 生成分享文本
    const shareText = `今日训练总结报告
==================
训练完成情况:
- 定向练习: ${progress.orientation ? '✅ 已完成' : '❌ 未完成'}
- 记忆训练: ${progress.memoryGames.length > 0 ? '✅ 已完成' : '❌ 未完成'}

得分情况:
- 定向练习得分: ${orientationScore}/3
- 记忆训练平均分: ${memoryScore}分

今日感受:
- 训练难度: ${window.getDifficultyText(feedback.ratings?.difficulty) || '未评价'}
- 还有想说的: ${feedback.textFeedback || '无'}

改进建议:
${window.app?.generatePerformanceAnalysis(orientationScore, memoryScore, progress)?.suggestions?.map(rec => `- ${rec}`).join('\n') || '继续保持良好的训练习惯！'}`;
    
    // 尝试使用Web Share API
    if (navigator.share) {
        navigator.share({
            title: '阿兹海默症记忆训练系统 - 今日总结',
            text: shareText
        }).catch(error => {
            console.log('分享失败:', error);
            // 如果分享失败，复制到剪贴板
            copyToClipboard(shareText);
        });
    } else {
        // 如果不支持Web Share API，复制到剪贴板
        copyToClipboard(shareText);
    }
};

// 复制文本到剪贴板的辅助函数
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    alert('总结报告已复制到剪贴板，您可以粘贴到其他应用中分享！');
}


// 定向练习答案提交函数
window.submitDateAnswer = function() {
    const yearInput = document.getElementById('year-part');
    const monthInput = document.getElementById('month-part');
    const dayInput = document.getElementById('day-part');
    const weekdayInput = document.getElementById('weekday-part');
    const feedback = document.getElementById('date-feedback');
    
    if (!yearInput || !monthInput || !dayInput || !weekdayInput || !feedback) return;
    
    const year = yearInput.value.trim();
    const month = monthInput.value.trim();
    const day = dayInput.value.trim();
    const weekday = weekdayInput.value;
    
    if (!year || !month || !day || !weekday) {
        alert('请填写完整的日期信息（年、月、日、星期）。');
        return;
    }
    
    if (window.app) {
        const result = window.app.validateDateAnswer(year, month, day, weekday);
        
        // 更新得分
        window.app.orientationScore.date = result.correct;
        if (result.correct) {
            window.app.orientationScore.total = Math.max(window.app.orientationScore.total, 1);
        }
        window.app.updateOrientationScoreDisplay();
        
        // 显示反馈
        feedback.innerHTML = result.feedback.replace(/\n/g, '<br>');
        feedback.className = `feedback-message ${result.correct ? 'correct' : 'incorrect'}`;
        
        // 保存定向练习详细得分到持久化存储
        if (window.storageManager) {
            window.storageManager.saveOrientationDetails(window.app.orientationScore);
        }
        
        // 禁用输入和按钮
        yearInput.disabled = true;
        monthInput.disabled = true;
        dayInput.disabled = true;
        weekdayInput.disabled = true;
        event.target.disabled = true;
        event.target.textContent = '已提交';
    }
};

window.submitCityAnswer = function() {
    const input = document.getElementById('city-input');
    const feedback = document.getElementById('city-feedback');
    
    if (!input || !feedback) return;
    
    const userAnswer = input.value.trim();
    if (!userAnswer) {
        alert('请输入城市名称。');
        return;
    }
    
    if (window.app) {
        const result = window.app.validateCityAnswer(userAnswer);
        
        // 更新得分
        window.app.orientationScore.city = result.correct;
        if (result.correct) {
            window.app.orientationScore.total = Math.max(window.app.orientationScore.total, 
                (window.app.orientationScore.date ? 1 : 0) + 1);
        }
        window.app.updateOrientationScoreDisplay();
        
        // 显示反馈
        feedback.innerHTML = result.feedback;
        feedback.className = `feedback-message ${result.correct ? 'correct' : 'incorrect'}`;
        
        // 保存定向练习详细得分到持久化存储
        if (window.storageManager) {
            window.storageManager.saveOrientationDetails(window.app.orientationScore);
        }
        
        // 禁用输入和按钮
        input.disabled = true;
        event.target.disabled = true;
        event.target.textContent = '已提交';
    }
};

window.submitDayNightAnswer = function() {
    const selectedOption = document.querySelector('input[name="daynight"]:checked');
    const feedback = document.getElementById('daynight-feedback');
    
    if (!feedback) return;
    
    if (!selectedOption) {
        alert('请选择白昼或黑夜。');
        return;
    }
    
    if (window.app) {
        const result = window.app.validateDayNightAnswer(selectedOption.value);
        
        // 更新得分
        window.app.orientationScore.daynight = result.correct;
        const totalCorrect = (window.app.orientationScore.date ? 1 : 0) + 
                           (window.app.orientationScore.city ? 1 : 0) + 
                           (window.app.orientationScore.daynight ? 1 : 0);
        window.app.orientationScore.total = totalCorrect;
        window.app.updateOrientationScoreDisplay();
        
        // 显示反馈
        feedback.innerHTML = result.feedback;
        feedback.className = `feedback-message ${result.correct ? 'correct' : 'incorrect'}`;
        
        // 禁用选项和按钮
        document.querySelectorAll('input[name="daynight"]').forEach(radio => {
            radio.disabled = true;
        });
        event.target.disabled = true;
        event.target.textContent = '已提交';
        
        // 保存定向练习详细得分到持久化存储
        if (window.storageManager) {
            window.storageManager.saveOrientationDetails(window.app.orientationScore);
        }
        
        // 如果所有题目都完成了，保存进度
        if (window.app.orientationScore.date !== false && 
            window.app.orientationScore.city !== false && 
            window.app.orientationScore.daynight !== false) {
            
            if (window.storageManager) {
                const progress = window.storageManager.getTodayProgress();
                progress.orientation = true;
                progress.orientationScore = window.app.orientationScore.total;
                window.storageManager.saveTodayProgress(progress);
            }
        }
    }
};

window.resetOrientationExercise = function() {
    if (confirm('确定要重新开始定向练习吗？')) {
        // 重置日期输入框
        const yearPart = document.getElementById('year-part');
        const monthPart = document.getElementById('month-part');
        const dayPart = document.getElementById('day-part');
        const weekdayPart = document.getElementById('weekday-part');
        const cityInput = document.getElementById('city-input');
        
        if (yearPart) {
            yearPart.value = '';
            yearPart.disabled = false;
        }
        if (monthPart) {
            monthPart.value = '';
            monthPart.disabled = false;
        }
        if (dayPart) {
            dayPart.value = '';
            dayPart.disabled = false;
        }
        if (weekdayPart) {
            weekdayPart.value = '';
            weekdayPart.disabled = false;
        }
        
        if (cityInput) {
            cityInput.value = '';
            cityInput.disabled = false;
        }
        
        // 重置单选按钮
        document.querySelectorAll('input[name="daynight"]').forEach(radio => {
            radio.checked = false;
            radio.disabled = false;
        });
        
        // 重置按钮
        document.querySelectorAll('.orientation-card button').forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes('submit')) {
                btn.disabled = false;
                if (btn.onclick.toString().includes('Date')) btn.textContent = '提交答案';
                if (btn.onclick.toString().includes('Year')) btn.textContent = '提交答案';
                if (btn.onclick.toString().includes('DayNight')) btn.textContent = '提交答案';
            }
        });
        
        // 清空反馈
        document.querySelectorAll('.feedback-message').forEach(feedback => {
            feedback.innerHTML = '';
            feedback.className = 'feedback-message';
        });
        
        // 重置得分
        if (window.app) {
            window.app.initializeOrientationScoring();
        }
    }
};

// 创建全局应用实例
window.app = new AlzheimerTrainingApp();

// 导出用于其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AlzheimerTrainingApp };
}
