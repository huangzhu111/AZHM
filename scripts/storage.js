// 数据存储管理系统
class StorageManager {
    constructor() {
        this.storageKey = 'alzheimer_training_data';
        this.initializeStorage();
    }

    // 初始化存储结构
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                settings: {
                    difficulty: 'medium',
                    fontSize: 'medium',
                    weatherApiKey: '',
                    highContrast: false
                },
                dailyProgress: {},
                gameScores: {},
                photos: [],
                memories: {},
                newsAnswers: {},
                emotions: {},
                feedback: {},
                statistics: {
                    totalSessions: 0,
                    averageScore: 0,
                    completedActivities: 0
                }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    // 获取所有数据
    getAllData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || {};
        } catch (error) {
            console.error('Error reading storage:', error);
            this.initializeStorage();
            return JSON.parse(localStorage.getItem(this.storageKey));
        }
    }

    // 保存数据
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving storage:', error);
            return false;
        }
    }

    // 获取设置
    getSettings() {
        const data = this.getAllData();
        return data.settings || {};
    }

    // 保存设置
    saveSettings(settings) {
        const data = this.getAllData();
        data.settings = { ...data.settings, ...settings };
        return this.saveData(data);
    }

    // 获取今日进度
    getTodayProgress() {
        const today = this.getTodayKey();
        const data = this.getAllData();
        return data.dailyProgress[today] || {
            orientation: false,
            news: false,
            memoryGames: [],
            photos: false,
            summary: false,
            startTime: new Date().toISOString(),
            scores: {}
        };
    }

    // 保存今日进度
    saveTodayProgress(progress) {
        const today = this.getTodayKey();
        const data = this.getAllData();
        if (!data.dailyProgress) data.dailyProgress = {};
        data.dailyProgress[today] = { ...this.getTodayProgress(), ...progress };
        return this.saveData(data);
    }

    // 保存定向练习详细得分
    saveOrientationDetails(details) {
        const today = this.getTodayKey();
        const data = this.getAllData();
        if (!data.dailyProgress) data.dailyProgress = {};
        if (!data.dailyProgress[today]) {
            data.dailyProgress[today] = this.getTodayProgress();
        }
        data.dailyProgress[today].orientationDetails = details;
        return this.saveData(data);
    }

    // 获取定向练习详细得分
    getOrientationDetails() {
        const today = this.getTodayKey();
        const data = this.getAllData();
        if (data.dailyProgress && data.dailyProgress[today] && data.dailyProgress[today].orientationDetails) {
            return data.dailyProgress[today].orientationDetails;
        }
        return {
            date: false,
            city: false,
            daynight: false,
            total: 0
        };
    }

    // 记录游戏得分
    recordGameScore(gameType, score, details = {}) {
        const today = this.getTodayKey();
        const data = this.getAllData();
        
        if (!data.gameScores) data.gameScores = {};
        if (!data.gameScores[today]) data.gameScores[today] = {};
        if (!data.gameScores[today][gameType]) data.gameScores[today][gameType] = [];
        
        data.gameScores[today][gameType].push({
            score: score,
            timestamp: new Date().toISOString(),
            details: details
        });

        // 更新今日进度
        const progress = this.getTodayProgress();
        if (!progress.memoryGames.includes(gameType)) {
            progress.memoryGames.push(gameType);
        }
        progress.scores[gameType] = score;
        this.saveTodayProgress(progress);

        return this.saveData(data);
    }

    // 获取游戏历史得分
    getGameScores(gameType, days = 7) {
        const data = this.getAllData();
        const scores = [];
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            
            if (data.gameScores && data.gameScores[dateKey] && data.gameScores[dateKey][gameType]) {
                scores.push({
                    date: dateKey,
                    scores: data.gameScores[dateKey][gameType]
                });
            }
        }
        
        return scores.reverse();
    }

    // 保存照片
    savePhoto(photoData, description = '') {
        const data = this.getAllData();
        if (!data.photos) data.photos = [];
        
        const photo = {
            id: Date.now().toString(),
            data: photoData,
            description: description,
            uploadDate: new Date().toISOString()
        };
        
        data.photos.push(photo);
        return this.saveData(data) ? photo.id : null;
    }

    // 获取所有照片
    getPhotos() {
        const data = this.getAllData();
        return data.photos || [];
    }

    // 删除照片
    deletePhoto(photoId) {
        const data = this.getAllData();
        if (data.photos) {
            data.photos = data.photos.filter(photo => photo.id !== photoId);
            return this.saveData(data);
        }
        return false;
    }

    // 保存照片回忆
    savePhotoMemory(photoId, memory) {
        const data = this.getAllData();
        if (!data.memories) data.memories = {};
        
        data.memories[photoId] = {
            content: memory,
            timestamp: new Date().toISOString()
        };
        
        return this.saveData(data);
    }

    // 获取照片回忆
    getPhotoMemory(photoId) {
        const data = this.getAllData();
        return data.memories && data.memories[photoId] ? data.memories[photoId] : null;
    }

    // 保存新闻回答
    saveNewsAnswer(answer) {
        const today = this.getTodayKey();
        const data = this.getAllData();
        if (!data.newsAnswers) data.newsAnswers = {};
        
        data.newsAnswers[today] = {
            answer: answer,
            timestamp: new Date().toISOString()
        };
        
        // 更新今日进度
        const progress = this.getTodayProgress();
        progress.news = true;
        this.saveTodayProgress(progress);
        
        return this.saveData(data);
    }

    // 获取新闻回答
    getNewsAnswer(date = null) {
        const dateKey = date || this.getTodayKey();
        const data = this.getAllData();
        return data.newsAnswers && data.newsAnswers[dateKey] ? data.newsAnswers[dateKey] : null;
    }

    // 获取今日反馈
    getTodayFeedback() {
        const today = this.getTodayKey();
        const data = this.getAllData();
        return data.feedback && data.feedback[today] ? data.feedback[today].content : {};
    }

    // 保存情绪反馈
    saveEmotion(emotion) {
        const today = this.getTodayKey();
        const data = this.getAllData();
        if (!data.emotions) data.emotions = {};
        
        data.emotions[today] = {
            emotion: emotion,
            timestamp: new Date().toISOString()
        };
        
        return this.saveData(data);
    }

    // 保存评分
    saveRating(category, value) {
        const today = this.getTodayKey();
        const data = this.getAllData();
        if (!data.feedback) data.feedback = {};
        if (!data.feedback[today]) {
            data.feedback[today] = {
                content: {},
                timestamp: new Date().toISOString()
            };
        }
        if (!data.feedback[today].content.ratings) {
            data.feedback[today].content.ratings = {};
        }
        
        data.feedback[today].content.ratings[category] = value;
        return this.saveData(data);
    }

    // 保存有帮助的活动
    saveHelpfulActivity(activity) {
        const today = this.getTodayKey();
        const data = this.getAllData();
        if (!data.feedback) data.feedback = {};
        if (!data.feedback[today]) {
            data.feedback[today] = {
                content: {},
                timestamp: new Date().toISOString()
            };
        }
        
        data.feedback[today].content.helpfulActivity = activity;
        return this.saveData(data);
    }

    // 保存每日反馈
    saveDailyFeedback(feedback) {
        const today = this.getTodayKey();
        const data = this.getAllData();
        if (!data.feedback) data.feedback = {};
        
        data.feedback[today] = {
            content: feedback,
            timestamp: new Date().toISOString()
        };
        
        // 更新今日进度
        const progress = this.getTodayProgress();
        progress.summary = true;
        this.saveTodayProgress(progress);
        
        return this.saveData(data);
    }

    // 获取统计数据
    getStatistics() {
        const data = this.getAllData();
        const stats = data.statistics || {};
        
        // 计算实时统计
        const dailyProgress = data.dailyProgress || {};
        const gameScores = data.gameScores || {};
        
        let totalSessions = Object.keys(dailyProgress).length;
        let totalScore = 0;
        let scoreCount = 0;
        let completedActivities = 0;
        
        Object.values(dailyProgress).forEach(day => {
            if (day.orientation) completedActivities++;
            if (day.news) completedActivities++;
            if (day.photos) completedActivities++;
            if (day.summary) completedActivities++;
            completedActivities += day.memoryGames ? day.memoryGames.length : 0;
        });
        
        Object.values(gameScores).forEach(dayScores => {
            Object.values(dayScores).forEach(gameScores => {
                gameScores.forEach(score => {
                    totalScore += score.score;
                    scoreCount++;
                });
            });
        });
        
        return {
            totalSessions,
            averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
            completedActivities,
            lastActivity: this.getLastActivityDate()
        };
    }

    // 获取最后活动日期
    getLastActivityDate() {
        const data = this.getAllData();
        const dates = Object.keys(data.dailyProgress || {});
        return dates.length > 0 ? dates.sort().pop() : null;
    }

    // 导出数据
    exportData() {
        const data = this.getAllData();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // 导入数据
    importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            // 验证数据结构
            if (importedData.settings && importedData.dailyProgress) {
                return this.saveData(importedData);
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // 清除所有数据
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.initializeStorage();
        return true;
    }

    // 获取今日日期键
    getTodayKey() {
        return this.getDateKey(new Date());
    }

    // 获取日期键
    getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    // 获取过去N天的进度数据
    getProgressHistory(days = 7) {
        const data = this.getAllData();
        const history = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            
            const dayProgress = data.dailyProgress[dateKey] || {};
            const dayScores = data.gameScores[dateKey] || {};
            
            // 计算当日完成度
            let completionRate = 0;
            const activities = ['orientation', 'news', 'photos', 'summary'];
            activities.forEach(activity => {
                if (dayProgress[activity]) completionRate += 25;
            });
            if (dayProgress.memoryGames && dayProgress.memoryGames.length > 0) {
                completionRate += Math.min(dayProgress.memoryGames.length * 5, 25);
            }
            
            // 计算当日平均分数
            let averageScore = 0;
            let scoreCount = 0;
            Object.values(dayScores).forEach(gameScores => {
                Object.values(gameScores).forEach(scores => {
                    scores.forEach(score => {
                        averageScore += score.score;
                        scoreCount++;
                    });
                });
            });
            averageScore = scoreCount > 0 ? Math.round(averageScore / scoreCount) : 0;
            
            history.push({
                date: dateKey,
                completionRate: Math.min(completionRate, 100),
                averageScore: averageScore,
                activities: dayProgress,
                emotion: data.emotions && data.emotions[dateKey] ? data.emotions[dateKey].emotion : null
            });
        }
        
        return history;
    }

    // 保存位置信息
    saveLocation(location) {
        const settings = this.getSettings();
        settings.currentLocation = location;
        return this.saveSettings(settings);
    }

    // 获取位置信息
    getLocation() {
        const settings = this.getSettings();
        return settings.currentLocation || '';
    }
}

// 创建全局存储管理器实例
window.storageManager = new StorageManager();

// 导出用于其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
