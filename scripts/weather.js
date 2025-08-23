// 天气API管理系统
class WeatherManager {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
        this.defaultCity = '北京';
        this.weatherCache = {};
        this.cacheExpiry = 30 * 60 * 1000; // 30分钟缓存
        this.loadSettings();
    }

    // 加载设置
    loadSettings() {
        if (window.storageManager) {
            const settings = window.storageManager.getSettings();
            this.apiKey = settings.weatherApiKey || '';
            this.defaultCity = settings.cityName || '北京';
        }
    }

    // 保存设置
    saveSettings(apiKey, cityName) {
        this.apiKey = apiKey;
        this.defaultCity = cityName;
        
        if (window.storageManager) {
            window.storageManager.saveSettings({
                weatherApiKey: apiKey,
                cityName: cityName
            });
        }
    }

    // 获取天气数据
    async getWeather(city = null) {
        const targetCity = city || this.defaultCity;
        const cacheKey = `weather_${targetCity}`;
        
        // 检查缓存
        if (this.weatherCache[cacheKey] && 
            Date.now() - this.weatherCache[cacheKey].timestamp < this.cacheExpiry) {
            return this.weatherCache[cacheKey].data;
        }

        try {
            // 如果没有API密钥，返回模拟数据
            if (!this.apiKey) {
                return this.getMockWeather(targetCity);
            }

            const url = `${this.baseUrl}?q=${encodeURIComponent(targetCity)}&appid=${this.apiKey}&units=metric&lang=zh_cn`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const weatherData = this.formatWeatherData(data);
            
            // 缓存数据
            this.weatherCache[cacheKey] = {
                data: weatherData,
                timestamp: Date.now()
            };
            
            return weatherData;
            
        } catch (error) {
            console.error('获取天气数据失败:', error);
            return this.getMockWeather(targetCity);
        }
    }

    // 格式化天气数据
    formatWeatherData(data) {
        const weatherMap = {
            'clear sky': { desc: '晴天', icon: '☀️', color: '#FFD700' },
            'few clouds': { desc: '少云', icon: '🌤️', color: '#87CEEB' },
            'scattered clouds': { desc: '多云', icon: '⛅', color: '#B0C4DE' },
            'broken clouds': { desc: '阴天', icon: '☁️', color: '#778899' },
            'overcast clouds': { desc: '阴天', icon: '☁️', color: '#778899' },
            'shower rain': { desc: '阵雨', icon: '🌦️', color: '#4682B4' },
            'rain': { desc: '雨天', icon: '🌧️', color: '#4169E1' },
            'thunderstorm': { desc: '雷雨', icon: '⛈️', color: '#483D8B' },
            'snow': { desc: '雪天', icon: '❄️', color: '#B0E0E6' },
            'mist': { desc: '雾天', icon: '🌫️', color: '#D3D3D3' }
        };

        const condition = data.weather[0].description.toLowerCase();
        const weather = weatherMap[condition] || { desc: '未知', icon: '🌡️', color: '#808080' };
        
        return {
            city: data.name,
            temperature: Math.round(data.main.temp),
            description: weather.desc,
            icon: weather.icon,
            color: weather.color,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            pressure: data.main.pressure,
            feelsLike: Math.round(data.main.feels_like),
            timestamp: new Date().toISOString()
        };
    }

    // 获取模拟天气数据
    getMockWeather(city) {
        const mockWeathers = [
            { desc: '晴天', icon: '☀️', color: '#FFD700', temp: 25 },
            { desc: '多云', icon: '⛅', color: '#B0C4DE', temp: 22 },
            { desc: '阴天', icon: '☁️', color: '#778899', temp: 18 },
            { desc: '雨天', icon: '🌧️', color: '#4169E1', temp: 15 },
            { desc: '雪天', icon: '❄️', color: '#B0E0E6', temp: -2 }
        ];
        
        // 根据当前时间和城市名生成一致的模拟数据
        const today = new Date().toDateString();
        const seed = this.hashCode(city + today);
        const weather = mockWeathers[Math.abs(seed) % mockWeathers.length];
        
        return {
            city: city,
            temperature: weather.temp + Math.floor(Math.abs(seed) % 10) - 5,
            description: weather.desc,
            icon: weather.icon,
            color: weather.color,
            humidity: 50 + Math.abs(seed) % 40,
            windSpeed: Math.abs(seed) % 10,
            pressure: 1013 + Math.abs(seed) % 20 - 10,
            feelsLike: weather.temp + Math.floor(Math.abs(seed) % 6) - 3,
            timestamp: new Date().toISOString(),
            isMock: true
        };
    }

    // 简单哈希函数
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash;
    }

    // 更新天气显示
    async updateWeatherDisplay() {
        const weatherDisplay = document.getElementById('weather-display');
        const weatherIcon = document.getElementById('weather-icon');
        const weatherDesc = document.getElementById('weather-desc');
        const weatherTemp = document.getElementById('weather-temp');
        
        if (!weatherDisplay) return;
        
        try {
            // 显示加载状态
            weatherIcon.innerHTML = '<div class="loading"></div>';
            weatherDesc.textContent = '获取天气中...';
            weatherTemp.textContent = '';
            
            const weather = await this.getWeather();
            
            // 更新显示
            weatherIcon.textContent = weather.icon;
            weatherIcon.style.color = weather.color;
            weatherDesc.textContent = weather.description;
            weatherTemp.textContent = `${weather.temperature}°C`;
            
            // 添加详细信息提示
            const detailInfo = `
                城市: ${weather.city}
                温度: ${weather.temperature}°C (体感 ${weather.feelsLike}°C)
                湿度: ${weather.humidity}%
                风速: ${weather.windSpeed} m/s
                气压: ${weather.pressure} hPa
                ${weather.isMock ? '\n(模拟数据，请在照护者界面设置API密钥获取真实天气)' : ''}
            `;
            weatherDisplay.title = detailInfo;
            
        } catch (error) {
            console.error('更新天气显示失败:', error);
            weatherIcon.textContent = '❓';
            weatherDesc.textContent = '天气获取失败';
            weatherTemp.textContent = '';
        }
    }

    // 获取天气建议
    getWeatherAdvice(weather) {
        const temp = weather.temperature;
        const desc = weather.description;
        
        let advice = [];
        
        if (temp < 0) {
            advice.push('天气很冷，注意保暖');
        } else if (temp < 10) {
            advice.push('天气较冷，多穿衣服');
        } else if (temp > 30) {
            advice.push('天气很热，注意防暑');
        } else if (temp > 25) {
            advice.push('天气较热，适当减衣');
        }
        
        if (desc.includes('雨')) {
            advice.push('今天有雨，出门记得带伞');
        } else if (desc.includes('雪')) {
            advice.push('今天下雪，路面湿滑要小心');
        } else if (desc.includes('晴')) {
            advice.push('今天天气不错，适合外出活动');
        }
        
        if (weather.humidity > 80) {
            advice.push('湿度较高，注意通风');
        }
        
        return advice.length > 0 ? advice : ['天气适宜，心情愉快'];
    }

    // 获取穿衣建议
    getClothingAdvice(weather) {
        const temp = weather.temperature;
        
        if (temp < -10) return '羽绒服、厚毛衣、保暖内衣';
        if (temp < 0) return '棉衣、毛衣、长裤';
        if (temp < 10) return '外套、毛衣、长裤';
        if (temp < 20) return '薄外套、长袖、长裤';
        if (temp < 25) return '长袖、薄裤子';
        if (temp < 30) return '短袖、薄裤子';
        return '短袖、短裤、注意防晒';
    }

    // 清除缓存
    clearCache() {
        this.weatherCache = {};
    }

    // 检查API密钥有效性
    async validateApiKey(apiKey, city = '北京') {
        try {
            const url = `${this.baseUrl}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=zh_cn`;
            const response = await fetch(url);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 获取支持的城市列表（常用中国城市）
    getSupportedCities() {
        return [
            '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都',
            '重庆', '天津', '西安', '沈阳', '青岛', '大连', '厦门', '苏州',
            '无锡', '宁波', '长沙', '郑州', '济南', '哈尔滨', '长春', '石家庄',
            '太原', '合肥', '南昌', '福州', '昆明', '贵阳', '兰州', '银川',
            '西宁', '乌鲁木齐', '拉萨', '呼和浩特', '南宁', '海口', '三亚'
        ];
    }
}

// 创建全局天气管理器实例
window.weatherManager = new WeatherManager();

// 刷新天气的全局函数
window.refreshWeather = async function() {
    if (window.weatherManager) {
        window.weatherManager.clearCache();
        await window.weatherManager.updateWeatherDisplay();
    }
};

// 导出用于其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherManager;
}
