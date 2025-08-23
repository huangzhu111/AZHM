// 记忆训练游戏系统
class MemoryGamesManager {
    constructor() {
        this.currentGame = null;
        this.gameData = {};
        this.difficulty = 'medium';
        this.loadSettings();
        
        // 游戏配置
        this.gameConfigs = {
            'number-sequence': {
                name: '数字序列复述',
                description: '记住并复述数字序列',
                levels: {
                    easy: { length: 3, time: 3000 },
                    medium: { length: 4, time: 2500 },
                    hard: { length: 6, time: 2000 }
                }
            },
            'word-recall': {
                name: '词语回忆',
                description: '记住并回忆词语列表',
                levels: {
                    easy: { count: 3, time: 5000 },
                    medium: { count: 5, time: 4000 },
                    hard: { count: 7, time: 3000 }
                }
            },
            'picture-matching': {
                name: '图片配对',
                description: '记住图片位置并配对',
                levels: {
                    easy: { pairs: 3, time: 8000 },
                    medium: { pairs: 4, time: 6000 },
                    hard: { pairs: 6, time: 5000 }
                }
            },
            'categorization': {
                name: '分类游戏',
                description: '将词语按类别分组',
                levels: {
                    easy: { categories: 2, items: 6 },
                    medium: { categories: 2, items: 8 },
                    hard: { categories: 3, items: 9 }
                }
            },
            'sudoku': {
                name: '数独游戏',
                description: '填入数字完成数独谜题',
                levels: {
                    easy: { size: 4, difficulty: 'easy' },
                    medium: { size: 6, difficulty: 'medium' },
                    hard: { size: 9, difficulty: 'hard' }
                }
            }
        };
        
        // 词语库
        this.wordLibrary = {
            animals: ['狗', '猫', '鸟', '鱼', '兔子', '老虎', '大象', '熊猫', '狮子', '猴子'],
            fruits: ['苹果', '香蕉', '橙子', '葡萄', '草莓', '西瓜', '桃子', '梨', '樱桃', '柠檬'],
            vegetables: ['白菜', '萝卜', '土豆', '番茄', '黄瓜', '茄子', '豆角', '菠菜', '洋葱', '胡萝卜'],
            colors: ['红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '黑色', '白色', '粉色', '灰色'],
            transportation: ['汽车', '火车', '飞机', '船', '自行车', '摩托车', '公交车', '地铁', '出租车', '卡车'],
            household: ['桌子', '椅子', '床', '沙发', '电视', '冰箱', '洗衣机', '空调', '台灯', '书柜'],
            food: ['米饭', '面条', '包子', '饺子', '面包', '牛奶', '鸡蛋', '肉', '鱼', '蔬菜'],
            body: ['头', '眼睛', '鼻子', '嘴巴', '耳朵', '手', '脚', '腿', '胳膊', '肚子']
        };
        
        // 图片表情符号库（用于图片配对游戏）
        this.emojiLibrary = [
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
            '🍎', '🍌', '🍊', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍', '🥭',
            '🌹', '🌻', '🌷', '🌺', '🌸', '💐', '🌼', '🌵', '🌲', '🌳',
            '⭐', '🌙', '☀️', '⛅', '🌈', '❄️', '⚡', '🔥', '💧', '🌊'
        ];
    }

    // 加载设置
    loadSettings() {
        if (window.storageManager) {
            const settings = window.storageManager.getSettings();
            this.difficulty = settings.difficulty || 'medium';
        }
    }

    // 开始游戏
    startGame(gameType) {
        this.currentGame = gameType;
        this.gameData = {};
        
        const gameArea = document.getElementById('game-area');
        const gameContent = document.getElementById('game-content');
        const gameControls = document.getElementById('game-controls');
        const gameScore = document.getElementById('game-score');
        
        if (!gameArea || !gameContent || !gameControls || !gameScore) return;
        
        // 显示游戏区域
        gameArea.classList.remove('hidden');
        
        // 清空内容
        gameContent.innerHTML = '';
        gameControls.innerHTML = '';
        gameScore.innerHTML = '';
        
        // 根据游戏类型启动相应游戏
        switch (gameType) {
            case 'number-sequence':
                this.startNumberSequenceGame();
                break;
            case 'word-recall':
                this.startWordRecallGame();
                break;
            case 'picture-matching':
                this.startPictureMatchingGame();
                break;
            case 'categorization':
                this.startCategorizationGame();
                break;
            case 'sudoku':
                this.startSudokuGame();
                break;
        }
    }

    // 数字序列复述游戏
    startNumberSequenceGame() {
        const config = this.gameConfigs['number-sequence'];
        const level = config.levels[this.difficulty];
        
        // 生成随机数字序列
        const sequence = [];
        for (let i = 0; i < level.length; i++) {
            sequence.push(Math.floor(Math.random() * 9) + 1);
        }
        
        this.gameData = {
            sequence: sequence,
            userInput: '',
            phase: 'display', // display, input, result
            startTime: Date.now()
        };
        
        const gameContent = document.getElementById('game-content');
        const gameControls = document.getElementById('game-controls');
        
        gameContent.innerHTML = `
            <h3>${config.name}</h3>
            <p>请记住以下数字序列：</p>
            <div id="sequence-display" class="sequence-display">
                ${sequence.join(' - ')}
            </div>
            <p>数字将在 ${level.time / 1000} 秒后消失</p>
        `;
        
        // 设置定时器隐藏数字
        setTimeout(() => {
            this.showNumberInput();
        }, level.time);
    }

    // 显示数字输入界面
    showNumberInput() {
        const gameContent = document.getElementById('game-content');
        const gameControls = document.getElementById('game-controls');
        
        this.gameData.phase = 'input';
        
        gameContent.innerHTML = `
            <h3>数字序列复述</h3>
            <p>请输入您记住的数字序列：</p>
            <input type="text" id="number-input" class="game-input" placeholder="例如：123 或 1 2 3">
        `;
        
        gameControls.innerHTML = `
            <button onclick="memoryGames.submitNumberSequence()">提交答案</button>
            <button onclick="memoryGames.restartGame()">重新开始</button>
        `;
        
        // 聚焦输入框
        setTimeout(() => {
            document.getElementById('number-input').focus();
        }, 100);
    }

    // 提交数字序列答案
    submitNumberSequence() {
        const input = document.getElementById('number-input');
        if (!input) return;
        
        // 允许用户输入连续数字或用空格分隔的数字
        const userInput = input.value.trim();
        let userSequence = [];
        
        // 如果输入包含空格，按空格分割
        if (userInput.includes(' ')) {
            userSequence = userInput.split(/\s+/).map(n => parseInt(n)).filter(n => !isNaN(n));
        } else {
            // 如果没有空格，将每个字符作为一个数字
            userSequence = userInput.split('').map(n => parseInt(n)).filter(n => !isNaN(n));
        }
        
        const correctSequence = this.gameData.sequence;
        
        // 计算得分
        let score = 0;
        const maxScore = 100;
        
        if (userSequence.length === correctSequence.length) {
            let correctCount = 0;
            for (let i = 0; i < correctSequence.length; i++) {
                if (userSequence[i] === correctSequence[i]) {
                    correctCount++;
                }
            }
            score = Math.round((correctCount / correctSequence.length) * maxScore);
        } else {
            // 长度不匹配，部分分数
            const minLength = Math.min(userSequence.length, correctSequence.length);
            let correctCount = 0;
            for (let i = 0; i < minLength; i++) {
                if (userSequence[i] === correctSequence[i]) {
                    correctCount++;
                }
            }
            score = Math.round((correctCount / correctSequence.length) * maxScore * 0.7);
        }
        
        this.showGameResult('number-sequence', score, {
            correct: correctSequence.join(' '),
            user: userSequence.join(' '),
            accuracy: score
        });
    }

    // 词语回忆游戏
    startWordRecallGame() {
        const config = this.gameConfigs['word-recall'];
        const level = config.levels[this.difficulty];
        
        // 从词库中随机选择目标词语
        const allWords = Object.values(this.wordLibrary).flat();
        const targetWords = this.shuffleArray(allWords).slice(0, level.count);
        
        // 生成干扰词语（目标词语数量的3倍）
        const distractorWords = this.shuffleArray(allWords).slice(0, level.count * 3);
        
        // 合并并去重
        const allOptions = this.shuffleArray([...targetWords, ...distractorWords]);
        
        this.gameData = {
            targetWords: targetWords,
            allOptions: allOptions,
            selectedWords: [],
            phase: 'display',
            startTime: Date.now()
        };
        
        const gameContent = document.getElementById('game-content');
        
        gameContent.innerHTML = `
            <h3>${config.name}</h3>
            <p>请记住以下词语：</p>
            <div id="words-display" class="words-display">
                ${targetWords.map(word => `<span class="word-item">${word}</span>`).join('')}
            </div>
            <p>词语将在 ${level.time / 1000} 秒后消失</p>
        `;
        
        // 设置定时器隐藏词语
        setTimeout(() => {
            this.showWordSelection();
        }, level.time);
    }

    // 显示词语选择界面
    showWordSelection() {
        const gameContent = document.getElementById('game-content');
        const gameControls = document.getElementById('game-controls');
        
        this.gameData.phase = 'input';
        
        // 检查是否有选项
        if (!this.gameData.allOptions || this.gameData.allOptions.length === 0) {
            console.error('No options available for word selection');
            gameContent.innerHTML = `
                <h3>词语回忆</h3>
                <p>错误：没有可用的词语选项</p>
            `;
            return;
        }
        
        // 生成选项按钮
        const optionsHtml = this.gameData.allOptions.map((word, index) => {
            // 确保词语不为空
            if (!word || word.trim() === '') {
                console.warn('Empty word found at index', index);
                return '';
            }
            return `<button class="word-option" onclick="memoryGames.selectWord(${index})" data-index="${index}">${word}</button>`;
        }).filter(html => html !== '').join('');
        
        // 检查是否生成了选项
        if (optionsHtml === '') {
            console.error('No valid options generated for word selection');
            gameContent.innerHTML = `
                <h3>词语回忆</h3>
                <p>错误：无法生成词语选项</p>
            `;
            return;
        }
        
        gameContent.innerHTML = `
            <h3>词语回忆</h3>
            <p>请选择您记住的词语：</p>
            <div id="word-options" class="word-options">
                ${optionsHtml}
            </div>
            <div id="selected-words" class="selected-words">
                <p>已选择的词语：</p>
                <div id="selected-words-list"></div>
            </div>
        `;
        
        gameControls.innerHTML = `
            <button onclick="memoryGames.submitWordRecall()">提交答案</button>
            <button onclick="memoryGames.restartGame()">重新开始</button>
        `;
        
        // 添加调试信息
        console.log('Word selection interface displayed with', this.gameData.allOptions.length, 'options');
    }

    // 选择词语
    selectWord(index) {
        const word = this.gameData.allOptions[index];
        const wordButton = document.querySelector(`[data-index="${index}"]`);
        
        if (!wordButton) return;
        
        // 切换选中状态
        if (this.gameData.selectedWords.includes(word)) {
            // 取消选择
            this.gameData.selectedWords = this.gameData.selectedWords.filter(w => w !== word);
            wordButton.classList.remove('selected');
        } else {
            // 选择词语
            this.gameData.selectedWords.push(word);
            wordButton.classList.add('selected');
        }
        
        // 更新已选择词语的显示
        const selectedWordsList = document.getElementById('selected-words-list');
        if (selectedWordsList) {
            selectedWordsList.innerHTML = this.gameData.selectedWords.map(word =>
                `<span class="selected-word-item">${word}</span>`
            ).join('');
        }
    }
    
    // 提交词语回忆答案
    submitWordRecall() {
        const userWords = this.gameData.selectedWords;
        const correctWords = this.gameData.targetWords;
        
        // 计算正确选择的数量
        let correctCount = 0;
        userWords.forEach(word => {
            if (correctWords.includes(word)) {
                correctCount++;
            }
        });
        
        // 计算错误选择的数量
        let incorrectCount = 0;
        userWords.forEach(word => {
            if (!correctWords.includes(word)) {
                incorrectCount++;
            }
        });
        
        // 计算准确率（正确选择的词语数 / 目标词语总数）
        const accuracy = correctWords.length > 0 ? correctCount / correctWords.length : 0;
        
        // 计算得分（线性评分：正确选择的词语数占目标词语总数的百分比）
        const score = Math.round((correctCount / correctWords.length) * 100);
        
        this.showGameResult('word-recall', score, {
            correct: correctWords.join(', '),
            user: userWords.join(', '),
            correctCount: correctCount,
            totalCount: correctWords.length,
            incorrectCount: incorrectCount
        });
    }

    // 图片配对游戏
    startPictureMatchingGame() {
        const config = this.gameConfigs['picture-matching'];
        const level = config.levels[this.difficulty];
        
        // 选择图片对
        const selectedEmojis = this.shuffleArray(this.emojiLibrary).slice(0, level.pairs);
        const cards = [...selectedEmojis, ...selectedEmojis]; // 创建配对
        const shuffledCards = this.shuffleArray(cards);
        
        this.gameData = {
            cards: shuffledCards,
            revealed: new Array(shuffledCards.length).fill(false),
            matched: new Array(shuffledCards.length).fill(false),
            firstCard: null,
            secondCard: null,
            moves: 0,
            startTime: Date.now(),
            phase: 'display'
        };
        
        const gameContent = document.getElementById('game-content');
        
        gameContent.innerHTML = `
            <h3>${config.name}</h3>
            <p>记住图片位置，然后进行配对：</p>
            <div id="cards-grid" class="cards-grid">
                ${shuffledCards.map((emoji, index) => 
                    `<div class="card" data-index="${index}">${emoji}</div>`
                ).join('')}
            </div>
            <p>图片将在 ${level.time / 1000} 秒后翻转</p>
        `;
        
        // 设置定时器翻转卡片
        setTimeout(() => {
            this.hideCards();
        }, level.time);
    }

    // 隐藏卡片并开始游戏
    hideCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.textContent = '?';
            card.classList.add('hidden-card');
            card.onclick = () => this.flipCard(index);
        });
        
        this.gameData.phase = 'playing';
        
        const gameControls = document.getElementById('game-controls');
        gameControls.innerHTML = `
            <button onclick="memoryGames.restartGame()">重新开始</button>
            <div class="game-info">移动次数: <span id="moves-count">0</span></div>
        `;
    }

    // 翻转卡片
    flipCard(index) {
        if (this.gameData.phase !== 'playing') return;
        if (this.gameData.revealed[index] || this.gameData.matched[index]) return;
        if (this.gameData.secondCard !== null) return;
        
        const card = document.querySelector(`[data-index="${index}"]`);
        card.textContent = this.gameData.cards[index];
        card.classList.remove('hidden-card');
        this.gameData.revealed[index] = true;
        
        if (this.gameData.firstCard === null) {
            this.gameData.firstCard = index;
        } else {
            this.gameData.secondCard = index;
            this.gameData.moves++;
            document.getElementById('moves-count').textContent = this.gameData.moves;
            
            // 检查是否匹配
            setTimeout(() => {
                this.checkMatch();
            }, 1000);
        }
    }

    // 检查卡片匹配
    checkMatch() {
        const first = this.gameData.firstCard;
        const second = this.gameData.secondCard;
        
        if (this.gameData.cards[first] === this.gameData.cards[second]) {
            // 匹配成功
            this.gameData.matched[first] = true;
            this.gameData.matched[second] = true;
            
            const firstCard = document.querySelector(`[data-index="${first}"]`);
            const secondCard = document.querySelector(`[data-index="${second}"]`);
            firstCard.classList.add('matched');
            secondCard.classList.add('matched');
            
            // 检查是否全部匹配
            if (this.gameData.matched.every(m => m)) {
                this.finishPictureMatching();
            }
        } else {
            // 匹配失败，翻回去
            this.gameData.revealed[first] = false;
            this.gameData.revealed[second] = false;
            
            const firstCard = document.querySelector(`[data-index="${first}"]`);
            const secondCard = document.querySelector(`[data-index="${second}"]`);
            firstCard.textContent = '?';
            secondCard.textContent = '?';
            firstCard.classList.add('hidden-card');
            secondCard.classList.add('hidden-card');
        }
        
        this.gameData.firstCard = null;
        this.gameData.secondCard = null;
    }

    // 完成图片配对游戏
    finishPictureMatching() {
        const moves = this.gameData.moves;
        const pairs = this.gameConfigs['picture-matching'].levels[this.difficulty].pairs;
        const perfectMoves = pairs;
        
        // 计算得分（移动次数越少得分越高）
        let score = 100;
        if (moves > perfectMoves) {
            score = Math.max(50, 100 - (moves - perfectMoves) * 10);
        }
        
        this.showGameResult('picture-matching', score, {
            moves: moves,
            pairs: pairs,
            efficiency: Math.round((perfectMoves / moves) * 100)
        });
    }

    // 分类游戏
    startCategorizationGame() {
        const config = this.gameConfigs['categorization'];
        const level = config.levels[this.difficulty];
        
        // 选择分类和物品
        const categories = Object.keys(this.wordLibrary);
        const selectedCategories = this.shuffleArray(categories).slice(0, level.categories);
        
        const items = [];
        const itemsPerCategory = Math.floor(level.items / level.categories);
        
        // 从每个选中的分类中选择物品
        selectedCategories.forEach(category => {
            const categoryItems = this.shuffleArray(this.wordLibrary[category]).slice(0, itemsPerCategory);
            items.push(...categoryItems);
        });
        
        // 如果物品不够，从选中的分类中补充
        while (items.length < level.items) {
            const randomCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
            const availableItems = this.wordLibrary[randomCategory].filter(item => !items.includes(item));
            if (availableItems.length > 0) {
                const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
                items.push(randomItem);
            } else {
                break; // 避免无限循环
            }
        }
        
        // 将所有物品的顺序打乱，避免按分类顺序显示
        const shuffledItems = this.shuffleArray(items);
        
        // 存储正确答案映射
        const correctMapping = {};
        selectedCategories.forEach(category => {
            this.wordLibrary[category].forEach(item => {
                if (items.includes(item)) {
                    correctMapping[item] = category;
                }
            });
        });
        
        this.gameData = {
            categories: selectedCategories,
            items: shuffledItems,
            correctMapping: correctMapping,
            userCategories: {},
            startTime: Date.now()
        };
        
        const gameContent = document.getElementById('game-content');
        const gameControls = document.getElementById('game-controls');
        
        gameContent.innerHTML = `
            <h3>${config.name}</h3>
            <p>请将以下词语按类别分组：</p>
            <div class="items-container">
                ${shuffledItems.map(item => 
                    `<span class="draggable-item" draggable="true" data-item="${item}">${item}</span>`
                ).join('')}
            </div>
            <div class="categories-container">
                ${selectedCategories.map(category => 
                    `<div class="category-box" data-category="${category}">
                        <h4>${this.getCategoryName(category)}</h4>
                        <div class="drop-zone" data-category="${category}"></div>
                    </div>`
                ).join('')}
            </div>
        `;
        
        gameControls.innerHTML = `
            <button onclick="memoryGames.submitCategorization()">提交答案</button>
            <button onclick="memoryGames.restartGame()">重新开始</button>
        `;
        
        // 添加拖拽功能
        this.setupDragAndDrop();
    }

    // 获取分类中文名称
    getCategoryName(category) {
        const names = {
            animals: '动物',
            fruits: '水果',
            vegetables: '蔬菜',
            colors: '颜色',
            transportation: '交通工具',
            household: '家具用品',
            food: '食物',
            body: '身体部位'
        };
        return names[category] || category;
    }

    // 设置拖拽功能
    setupDragAndDrop() {
        const items = document.querySelectorAll('.draggable-item');
        const dropZones = document.querySelectorAll('.drop-zone');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.item);
            });
            
            // 添加点击功能（移动设备友好）
            item.addEventListener('click', () => {
                this.selectItemForCategory(item);
            });
        });
        
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                const itemText = e.dataTransfer.getData('text/plain');
                const category = e.target.dataset.category;
                this.addItemToCategory(itemText, category);
            });
        });
    }

    // 选择物品进行分类（点击模式）
    selectItemForCategory(itemElement) {
        // 移除之前的选择
        document.querySelectorAll('.draggable-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 选择当前物品
        itemElement.classList.add('selected');
        
        // 高亮分类区域
        document.querySelectorAll('.category-box').forEach(box => {
            box.classList.add('highlight');
            box.onclick = () => {
                const category = box.dataset.category;
                const itemText = itemElement.dataset.item;
                this.addItemToCategory(itemText, category);
                box.classList.remove('highlight');
                document.querySelectorAll('.category-box').forEach(b => {
                    b.classList.remove('highlight');
                    b.onclick = null;
                });
            };
        });
    }

    // 添加物品到分类
    addItemToCategory(itemText, category) {
        const dropZone = document.querySelector(`.drop-zone[data-category="${category}"]`);
        const itemElement = document.querySelector(`[data-item="${itemText}"]`);
        
        if (dropZone && itemElement) {
            // 创建新的物品元素
            const newItem = document.createElement('span');
            newItem.textContent = itemText;
            newItem.className = 'categorized-item';
            newItem.onclick = () => {
                // 点击可以移回原位
                this.removeItemFromCategory(newItem, itemText);
            };
            
            dropZone.appendChild(newItem);
            itemElement.style.display = 'none';
        }
    }

    // 从分类中移除物品
    removeItemFromCategory(itemElement, itemText) {
        itemElement.remove();
        const originalItem = document.querySelector(`[data-item="${itemText}"]`);
        if (originalItem) {
            originalItem.style.display = 'inline-block';
        }
    }

    // 提交分类答案
    submitCategorization() {
        // 检查是否还有未分类的词语
        const remainingItems = document.querySelectorAll('.draggable-item[style*="display: none"]').length;
        const totalItems = this.gameData.items.length;
        const categorizedItems = totalItems - document.querySelectorAll('.draggable-item:not([style*="display: none"])').length;
        
        // 如果还有词语未分类，提示用户继续
        if (categorizedItems < totalItems) {
            const gameContent = document.getElementById('game-content');
            const currentContent = gameContent.innerHTML;
            
            // 添加提示信息
            const warningDiv = document.createElement('div');
            warningDiv.className = 'warning-message';
            warningDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; margin: 10px 0; border-radius: 5px; text-align: center;';
            warningDiv.innerHTML = `<strong>请注意：</strong> 您还有 ${totalItems - categorizedItems} 个词语未分类，请将所有词语都分类后再提交答案！`;
            
            // 移除之前的警告信息（如果有）
            const existingWarning = document.querySelector('.warning-message');
            if (existingWarning) {
                existingWarning.remove();
            }
            
            // 在标题后插入警告信息
            const title = gameContent.querySelector('h3');
            if (title) {
                title.insertAdjacentElement('afterend', warningDiv);
            }
            
            // 3秒后自动移除警告信息
            setTimeout(() => {
                if (warningDiv.parentNode) {
                    warningDiv.remove();
                }
            }, 3000);
            
            return; // 不继续执行评分
        }
        
        const userCategories = {};
        
        // 收集用户的分类结果
        document.querySelectorAll('.drop-zone').forEach(zone => {
            const category = zone.dataset.category;
            const items = Array.from(zone.querySelectorAll('.categorized-item')).map(item => item.textContent);
            userCategories[category] = items;
        });
        
        // 计算得分 - 现在所有词语都已分类
        let correctCount = 0;
        const totalCount = totalItems; // 使用总词语数量
        
        Object.keys(userCategories).forEach(category => {
            userCategories[category].forEach(item => {
                // 使用存储的正确映射来检查答案
                if (this.gameData.correctMapping[item] === category) {
                    correctCount++;
                }
            });
        });
        
        const score = Math.round((correctCount / totalCount) * 100);
        
        this.showGameResult('categorization', score, {
            correct: correctCount,
            total: totalCount,
            categories: Object.keys(userCategories).length
        });
    }


    // 显示游戏结果
    showGameResult(gameType, score, details) {
        const gameContent = document.getElementById('game-content');
        const gameControls = document.getElementById('game-controls');
        const gameScore = document.getElementById('game-score');
        
        // 记录得分
        if (window.storageManager) {
            window.storageManager.recordGameScore(gameType, score, details);
        }
        
        // 生成反馈
        let feedback = '';
        if (score >= 90) {
            feedback = '优秀！您的记忆力很棒！';
        } else if (score >= 70) {
            feedback = '很好！继续保持！';
        } else if (score >= 50) {
            feedback = '不错！还有提升空间！';
        } else {
            feedback = '继续努力！多练习会有进步的！';
        }
        
        gameContent.innerHTML = `
            <h3>游戏结束</h3>
            <div class="result-score">
                <div class="score-circle">
                    <span class="score-number">${score}</span>
                    <span class="score-label">分</span>
                </div>
            </div>
            <p class="result-feedback">${feedback}</p>
            <div class="result-details">
                ${this.formatGameDetails(gameType, details)}
            </div>
        `;
        
        gameControls.innerHTML = `
            <button onclick="memoryGames.startGame('${gameType}')">再玩一次</button>
            <button onclick="memoryGames.hideGameArea()">返回游戏列表</button>
        `;
        
        gameScore.innerHTML = `
            <div class="score-summary">
                <h4>本次得分: ${score}分</h4>
                <p>${feedback}</p>
            </div>
        `;
    }

    // 格式化游戏详情
    formatGameDetails(gameType, details) {
        switch (gameType) {
            case 'number-sequence':
                return `
                    <p><strong>正确答案:</strong> ${details.correct}</p>
                    <p><strong>您的答案:</strong> ${details.user}</p>
                `;
            case 'word-recall':
                return `
                    <p><strong>正确词语:</strong> ${details.correct}</p>
                    <p><strong>您的选择:</strong> ${details.user}</p>
                    <p><strong>正确选择:</strong> ${details.correctCount}/${details.totalCount}</p>
                    <p><strong>错误选择:</strong> ${details.incorrectCount}</p>
                `;
            case 'picture-matching':
                return `
                    <p><strong>移动次数:</strong> ${details.moves}</p>
                    <p><strong>配对数量:</strong> ${details.pairs}</p>
                    <p><strong>效率:</strong> ${details.efficiency}%</p>
                `;
            case 'categorization':
                return `
                    <p><strong>正确分类:</strong> ${details.correct}/${details.total}</p>
                    <p><strong>分类数量:</strong> ${details.categories}</p>
                `;
            case 'sudoku':
                return `
                    <p><strong>完成时间:</strong> ${Math.floor(details.time / 60)}分${details.time % 60}秒</p>
                    <p><strong>错误次数:</strong> ${details.mistakes}</p>
                    <p><strong>使用提示:</strong> ${details.hintsUsed}</p>
                    <p><strong>数独大小:</strong> ${details.size}x${details.size}</p>
                `;
            default:
                return '';
        }
    }

    // 重新开始游戏
    restartGame() {
        if (this.currentGame) {
            this.startGame(this.currentGame);
        }
    }

    // 隐藏游戏区域
    hideGameArea() {
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.classList.add('hidden');
        }
        this.currentGame = null;
        this.gameData = {};
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

    // 更新难度设置
    updateDifficulty(difficulty) {
        this.difficulty = difficulty;
        if (window.storageManager) {
            window.storageManager.saveSettings({ difficulty: difficulty });
        }
    }

    // 数独游戏
    startSudokuGame() {
        const config = this.gameConfigs['sudoku'];
        const level = config.levels[this.difficulty];
        
        // 生成数独谜题
        const puzzle = this.generateSudokuPuzzle(level.size);
        
        this.gameData = {
            size: level.size,
            puzzle: puzzle.puzzle,
            solution: puzzle.solution,
            userGrid: puzzle.puzzle.map(row => [...row]),
            startTime: Date.now(),
            mistakes: 0,
            hints: 3
        };
        
        const gameContent = document.getElementById('game-content');
        const gameControls = document.getElementById('game-controls');
        
        gameContent.innerHTML = `
            <h3>${config.name}</h3>
            <p>填入数字完成数独谜题（${level.size}x${level.size}）</p>
            <div id="sudoku-grid" class="sudoku-grid sudoku-${level.size}x${level.size}">
                ${this.renderSudokuGrid(level.size)}
            </div>
            <div class="sudoku-info">
                <div class="info-item">
                    <span>错误次数: </span>
                    <span id="mistake-count">0</span>
                </div>
                <div class="info-item">
                    <span>提示次数: </span>
                    <span id="hint-count">3</span>
                </div>
            </div>
        `;
        
        gameControls.innerHTML = `
            <div class="sudoku-controls">
                <button onclick="memoryGames.getHint()">获取提示</button>
                <button onclick="memoryGames.checkSudoku()">检查答案</button>
                <button onclick="memoryGames.restartGame()">重新开始</button>
            </div>
        `;
        
        // 设置数独网格事件
        this.setupSudokuEvents();
    }

    // 生成数独谜题
    generateSudokuPuzzle(size) {
        // 创建完整的数独解决方案
        const solution = this.generateCompleteSudoku(size);
        
        // 从解决方案中移除一些数字创建谜题
        const puzzle = solution.map(row => [...row]);
        const cellsToRemove = Math.floor(size * size * 0.4); // 移除40%的数字
        
        for (let i = 0; i < cellsToRemove; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * size);
                col = Math.floor(Math.random() * size);
            } while (puzzle[row][col] === 0);
            
            puzzle[row][col] = 0;
        }
        
        return { puzzle, solution };
    }

    // 生成完整的数独解决方案
    generateCompleteSudoku(size) {
        const grid = Array(size).fill().map(() => Array(size).fill(0));
        
        // 简化的数独生成算法
        if (size === 4) {
            // 4x4数独的简单模板
            const template = [
                [1, 2, 3, 4],
                [3, 4, 1, 2],
                [2, 3, 4, 1],
                [4, 1, 2, 3]
            ];
            return this.shuffleSudoku(template, size);
        } else if (size === 6) {
            // 6x6数独的简单模板
            const template = [
                [1, 2, 3, 4, 5, 6],
                [4, 5, 6, 1, 2, 3],
                [2, 3, 1, 5, 6, 4],
                [5, 6, 4, 2, 3, 1],
                [3, 1, 2, 6, 4, 5],
                [6, 4, 5, 3, 1, 2]
            ];
            return this.shuffleSudoku(template, size);
        } else {
            // 9x9数独的简单模板
            const template = [
                [5, 3, 4, 6, 7, 8, 9, 1, 2],
                [6, 7, 2, 1, 9, 5, 3, 4, 8],
                [1, 9, 8, 3, 4, 2, 5, 6, 7],
                [8, 5, 9, 7, 6, 1, 4, 2, 3],
                [4, 2, 6, 8, 5, 3, 7, 9, 1],
                [7, 1, 3, 9, 2, 4, 8, 5, 6],
                [9, 6, 1, 5, 3, 7, 2, 8, 4],
                [2, 8, 7, 4, 1, 9, 6, 3, 5],
                [3, 4, 5, 2, 8, 6, 1, 7, 9]
            ];
            return this.shuffleSudoku(template, size);
        }
    }

    // 打乱数独模板
    shuffleSudoku(template, size) {
        const grid = template.map(row => [...row]);
        
        // 随机交换数字
        const numbers = Array.from({length: size}, (_, i) => i + 1);
        const shuffledNumbers = this.shuffleArray(numbers);
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const originalNumber = grid[i][j];
                grid[i][j] = shuffledNumbers[originalNumber - 1];
            }
        }
        
        return grid;
    }

    // 渲染数独网格
    renderSudokuGrid(size) {
        let html = '';
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const value = this.gameData.puzzle[i][j];
                const isFixed = value !== 0;
                html += `
                    <input type="text" 
                           class="sudoku-cell ${isFixed ? 'fixed' : ''}" 
                           data-row="${i}" 
                           data-col="${j}"
                           value="${value || ''}"
                           ${isFixed ? 'readonly' : ''}
                           maxlength="1">
                `;
            }
        }
        return html;
    }

    // 设置数独事件
    setupSudokuEvents() {
        const cells = document.querySelectorAll('.sudoku-cell:not(.fixed)');
        
        cells.forEach(cell => {
            cell.addEventListener('input', (e) => {
                const value = e.target.value;
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                // 只允许输入数字
                if (value && !/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // 检查输入范围
                const maxValue = this.gameData.size;
                if (value && (parseInt(value) < 1 || parseInt(value) > maxValue)) {
                    e.target.value = '';
                    return;
                }
                
                // 更新用户网格
                this.gameData.userGrid[row][col] = value ? parseInt(value) : 0;
                
                // 检查是否违反数独规则
                if (value && !this.isValidMove(row, col, parseInt(value))) {
                    e.target.classList.add('error');
                    this.gameData.mistakes++;
                    document.getElementById('mistake-count').textContent = this.gameData.mistakes;
                } else {
                    e.target.classList.remove('error');
                }
                
                // 检查是否完成
                if (this.isSudokuComplete()) {
                    setTimeout(() => {
                        this.finishSudoku();
                    }, 500);
                }
            });
            
            cell.addEventListener('focus', (e) => {
                e.target.select();
            });
        });
    }

    // 检查移动是否有效
    isValidMove(row, col, value) {
        const size = this.gameData.size;
        const grid = this.gameData.userGrid;
        
        // 检查行
        for (let j = 0; j < size; j++) {
            if (j !== col && grid[row][j] === value) {
                return false;
            }
        }
        
        // 检查列
        for (let i = 0; i < size; i++) {
            if (i !== row && grid[i][col] === value) {
                return false;
            }
        }
        
        // 检查子网格（仅对9x9数独）
        if (size === 9) {
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            
            for (let i = boxRow; i < boxRow + 3; i++) {
                for (let j = boxCol; j < boxCol + 3; j++) {
                    if ((i !== row || j !== col) && grid[i][j] === value) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    // 检查数独是否完成
    isSudokuComplete() {
        const grid = this.gameData.userGrid;
        const size = this.gameData.size;
        
        // 检查是否所有格子都填满
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (grid[i][j] === 0) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // 获取提示
    getHint() {
        if (this.gameData.hints <= 0) {
            alert('没有更多提示了！');
            return;
        }
        
        const size = this.gameData.size;
        const emptyCells = [];
        
        // 找到所有空格子
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (this.gameData.userGrid[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }
        
        if (emptyCells.length === 0) {
            alert('数独已经完成了！');
            return;
        }
        
        // 随机选择一个空格子给出提示
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const row = randomCell.row;
        const col = randomCell.col;
        const correctValue = this.gameData.solution[row][col];
        
        // 更新网格和界面
        this.gameData.userGrid[row][col] = correctValue;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.value = correctValue;
            cell.classList.add('hint');
            cell.classList.remove('error');
        }
        
        // 减少提示次数
        this.gameData.hints--;
        document.getElementById('hint-count').textContent = this.gameData.hints;
        
        // 检查是否完成
        if (this.isSudokuComplete()) {
            setTimeout(() => {
                this.finishSudoku();
            }, 500);
        }
    }

    // 检查数独答案
    checkSudoku() {
        const size = this.gameData.size;
        let correctCount = 0;
        let totalFilled = 0;
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (this.gameData.userGrid[i][j] !== 0) {
                    totalFilled++;
                    if (this.gameData.userGrid[i][j] === this.gameData.solution[i][j]) {
                        correctCount++;
                    }
                }
            }
        }
        
        const accuracy = totalFilled > 0 ? Math.round((correctCount / totalFilled) * 100) : 0;
        const completion = Math.round((totalFilled / (size * size)) * 100);
        
        alert(`当前进度：\n完成度：${completion}%\n准确率：${accuracy}%\n正确格子：${correctCount}/${totalFilled}`);
    }

    // 完成数独游戏
    finishSudoku() {
        const endTime = Date.now();
        const timeSpent = Math.round((endTime - this.gameData.startTime) / 1000);
        const mistakes = this.gameData.mistakes;
        const hintsUsed = 3 - this.gameData.hints;
        
        // 计算得分
        let score = 100;
        
        // 根据错误次数扣分
        score -= mistakes * 5;
        
        // 根据使用提示次数扣分
        score -= hintsUsed * 10;
        
        // 根据时间给予奖励（快速完成）
        const timeBonus = Math.max(0, 300 - timeSpent) / 10; // 5分钟内完成有奖励
        score += timeBonus;
        
        // 确保得分在合理范围内
        score = Math.max(0, Math.min(100, Math.round(score)));
        
        this.showGameResult('sudoku', score, {
            time: timeSpent,
            mistakes: mistakes,
            hintsUsed: hintsUsed,
            size: this.gameData.size
        });
    }

    // 获取游戏统计
    getGameStatistics() {
        if (!window.storageManager) return {};
        
        const stats = {};
        Object.keys(this.gameConfigs).forEach(gameType => {
            const scores = window.storageManager.getGameScores(gameType, 30); // 最近30天
            if (scores.length > 0) {
                const allScores = scores.flatMap(day => day.scores.map(s => s.score));
                stats[gameType] = {
                    totalPlays: allScores.length,
                    averageScore: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length),
                    bestScore: Math.max(...allScores),
                    recentScore: allScores[allScores.length - 1]
                };
            }
        });
        
        return stats;
    }
}

// 创建全局记忆游戏管理器实例
window.memoryGames = new MemoryGamesManager();

// 开始游戏的全局函数
window.startGame = function(gameType) {
    if (window.memoryGames) {
        window.memoryGames.startGame(gameType);
    }
};

// 导出用于其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryGamesManager;
}
