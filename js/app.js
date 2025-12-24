/**
 * Главный модуль игры "Миссия: Звездолёт"
 * Механика по шаблонам Mars2
 */

const Game = {
    // Состояние игры
    state: {
        players: [],
        currentPlayerIndex: 0,
        currentTurn: 1,
        maxTurns: 20,
        currentPhase: 'planning', // planning, dice_roll, results
        missionPoints: 100,       // ОМ
        actionPoints: 5,          // ОД
        diceRoll: [0, 0],
        activeDefects: [],        // Активные дефекты
        activeFeatures: [],       // Установленные фичи
        activeCrashes: [],        // Активные сбои (от сломанных фич)
        availableFeatures: [],    // Доступные для покупки фичи
        playerJokers: [],
        usedJokerIds: [],
        isGameOver: false,
        triggeredEvents: []
    },

    // DOM элементы
    elements: {},

    /**
     * Инициализация игры
     */
    async init() {
        console.log('🚀 Инициализация игры...');

        const cardsLoaded = await CardsManager.init();
        if (!cardsLoaded) {
            alert('Ошибка загрузки карточек!');
            return;
        }

        this.cacheElements();
        this.bindEvents();
        this.showScreen('main-menu');

        console.log('✅ Игра инициализирована');
    },

    /**
     * Кэширование DOM элементов
     */
    cacheElements() {
        this.elements = {
            // Экраны
            mainMenu: document.getElementById('main-menu'),
            cardsViewer: document.getElementById('cards-viewer'),
            gameScreen: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over'),

            // Меню
            playerCountBtns: document.querySelectorAll('.player-btn'),
            playerNames: document.getElementById('player-names'),
            startGameBtn: document.getElementById('start-game'),
            viewCardsBtn: document.getElementById('view-cards'),
            viewRulesBtn: document.getElementById('view-rules'),

            // Модальное окно правил
            rulesModal: document.getElementById('rules-modal'),
            rulesModalClose: document.getElementById('rules-modal-close'),

            // Просмотр карточек
            backToMenuBtn: document.getElementById('back-to-menu'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            cardsGrid: document.getElementById('cards-grid'),

            // Игровой экран
            exitGameBtn: document.getElementById('exit-game'),
            currentTurn: document.getElementById('current-turn'),
            maxTurns: document.getElementById('max-turns'),
            missionPoints: document.getElementById('mission-points'),
            actionPoints: document.getElementById('action-points'),
            phases: document.querySelectorAll('.phase'),
            dice1: document.getElementById('dice-1'),
            dice2: document.getElementById('dice-2'),
            diceTotal: document.getElementById('dice-total'),
            rollDiceBtn: document.getElementById('roll-dice'),
            currentPlayerName: document.getElementById('current-player-name'),
            endTurnBtn: document.getElementById('end-turn'),
            logEntries: document.getElementById('log-entries'),
            activeDefects: document.getElementById('active-defects'),
            activeUpgrades: document.getElementById('active-upgrades'),
            availableUpgrades: document.getElementById('available-upgrades'),
            playerJokers: document.getElementById('player-jokers'),

            // Модальные окна
            modal: document.getElementById('card-modal'),
            modalCard: document.getElementById('modal-card'),
            modalActions: document.getElementById('modal-actions'),
            modalClose: document.querySelector('.modal-close'),

            sectionModal: document.getElementById('section-modal'),
            sectionModalTitle: document.getElementById('section-modal-title'),
            sectionModalCards: document.getElementById('section-modal-cards'),
            sectionModalClose: document.getElementById('section-modal-close'),

            // Заголовки секций
            defectsSection: document.querySelector('.defects-section'),
            upgradesSection: document.querySelector('.upgrades-section'),
            availableSection: document.querySelector('.available-section'),
            jokersSection: document.querySelector('.jokers-section'),

            shipArea: document.querySelector('.ship-area'),

            // Конец игры
            gameOverTitle: document.getElementById('game-over-title'),
            finalScore: document.getElementById('final-score'),
            gameOverMessage: document.getElementById('game-over-message'),
            playAgainBtn: document.getElementById('play-again'),
            backToMenuEndBtn: document.getElementById('back-to-menu-end')
        };
    },

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        this.elements.playerCountBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setPlayerCount(parseInt(btn.dataset.count)));
        });

        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.elements.viewCardsBtn.addEventListener('click', () => this.showCardsViewer());

        if (this.elements.viewRulesBtn) {
            this.elements.viewRulesBtn.addEventListener('click', () => this.openRulesModal());
        }
        if (this.elements.rulesModalClose) {
            this.elements.rulesModalClose.addEventListener('click', () => this.closeRulesModal());
        }
        if (this.elements.rulesModal) {
            this.elements.rulesModal.addEventListener('click', (e) => {
                if (e.target === this.elements.rulesModal) this.closeRulesModal();
            });
        }

        this.elements.backToMenuBtn.addEventListener('click', () => this.showScreen('main-menu'));

        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.filterCards(btn.dataset.filter));
        });

        this.elements.exitGameBtn.addEventListener('click', () => this.exitGame());
        this.elements.rollDiceBtn.addEventListener('click', () => this.rollDice());
        this.elements.endTurnBtn.addEventListener('click', () => this.endTurn());

        this.elements.modalClose?.addEventListener('click', () => this.closeModal());
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });

        // Клики по заголовкам секций
        this.elements.defectsSection?.querySelector('h3')?.addEventListener('click', () => {
            const allDefectsAndCrashes = [...this.state.activeDefects, ...this.state.activeCrashes];
            this.openSectionModal('defects', 'Активные дефекты и сбои', allDefectsAndCrashes);
        });
        this.elements.upgradesSection?.querySelector('h3')?.addEventListener('click', () => {
            this.openSectionModal('features', 'Установленные фичи', this.state.activeFeatures);
        });
        this.elements.availableSection?.querySelector('h3')?.addEventListener('click', () => {
            this.openSectionModal('available', 'Доступные фичи', this.state.availableFeatures);
        });
        this.elements.jokersSection?.querySelector('h3')?.addEventListener('click', () => {
            this.openSectionModal('jokers', 'Джокеры', this.state.playerJokers);
        });

        this.elements.sectionModalClose?.addEventListener('click', () => this.closeSectionModal());
        this.elements.sectionModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.sectionModal) this.closeSectionModal();
        });

        this.elements.playAgainBtn.addEventListener('click', () => this.startGame());
        this.elements.backToMenuEndBtn.addEventListener('click', () => this.showScreen('main-menu'));
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    setPlayerCount(count) {
        this.elements.playerCountBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
        });

        const container = this.elements.playerNames;
        container.innerHTML = '';

        for (let i = 1; i <= count; i++) {
            const div = document.createElement('div');
            div.className = 'player-input';
            div.innerHTML = `
                <label>Игрок ${i}${i === 1 ? ' (Капитан)' : ''}</label>
                <input type="text" id="player-${i}" placeholder="Имя игрока" value="${this.getDefaultPlayerName(i)}">
            `;
            container.appendChild(div);
        }
    },

    getDefaultPlayerName(index) {
        const names = ['Капитан', 'Инженер', 'Пилот', 'Медик'];
        return names[index - 1] || `Игрок ${index}`;
    },

    /**
     * Начать игру
     */
    startGame() {
        const playerInputs = document.querySelectorAll('#player-names input');
        this.state.players = Array.from(playerInputs).map((input, i) => ({
            id: i,
            name: input.value || this.getDefaultPlayerName(i + 1),
            isMaster: i === 0
        }));

        // Сбрасываем состояние
        this.state.currentPlayerIndex = 0;
        this.state.currentTurn = 1;
        this.state.currentPhase = 'planning';
        this.state.missionPoints = 100;
        this.state.actionPoints = 5;
        this.state.diceRoll = [0, 0];
        this.state.isGameOver = false;
        this.state.playerJokers = [];
        this.state.usedJokerIds = [];
        this.state.triggeredEvents = [];

        // Начальные карточки
        this.state.activeDefects = CardsManager.getRandomDefects(1);
        this.state.activeDefects.forEach(d => d.isActive = true);
        this.state.activeFeatures = [];
        this.state.activeCrashes = [];
        this.state.availableFeatures = CardsManager.getRandomFeatures(3);

        this.updateUI();

        this.elements.logEntries.innerHTML = '';
        this.addLog('🚀 Миссия начинается!');
        this.addLog(`📅 Ход 1`);
        this.addLog(`👤 ${this.state.players[0].name} берёт управление`);
        this.addLog('🔧 Фаза планирования');

        this.showScreen('game-screen');
    },

    /**
     * Обновить UI
     */
    updateUI() {
        this.elements.currentTurn.textContent = this.state.currentTurn;
        this.elements.maxTurns.textContent = this.state.maxTurns;
        this.elements.missionPoints.textContent = this.state.missionPoints;
        this.elements.actionPoints.textContent = this.state.actionPoints;

        const currentPlayer = this.state.players[this.state.currentPlayerIndex];
        this.elements.currentPlayerName.textContent = currentPlayer.name;

        // Фазы
        this.elements.phases.forEach(phase => {
            phase.classList.toggle('active', phase.dataset.phase === this.state.currentPhase);
        });

        // Кубики
        this.elements.dice1.textContent = this.state.diceRoll[0] || '?';
        this.elements.dice2.textContent = this.state.diceRoll[1] || '?';
        const total = this.state.diceRoll[0] + this.state.diceRoll[1];
        this.elements.diceTotal.textContent = total || '?';

        // Кнопки
        if (this.state.currentPhase === 'planning') {
            this.elements.rollDiceBtn.disabled = true;
            this.elements.endTurnBtn.disabled = false;
            this.elements.endTurnBtn.textContent = 'Проверить состояние корабля 🚀';
        } else if (this.state.currentPhase === 'dice_roll') {
            this.elements.rollDiceBtn.disabled = false;
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = 'Ожидание броска...';
        } else if (this.state.currentPhase === 'results') {
            this.elements.rollDiceBtn.disabled = true;
            this.elements.endTurnBtn.disabled = false;
            this.elements.endTurnBtn.textContent = 'Следующий ход →';
        }

        this.renderCards();
    },

    /**
     * Рендер карточек
     */
    renderCards() {
        // Активные дефекты + сбои
        this.elements.activeDefects.innerHTML = '';
        [...this.state.activeDefects, ...this.state.activeCrashes].forEach(card => {
            const miniCard = CardsManager.createMiniCard(card, 'defect');
            miniCard.addEventListener('click', () => this.showCardModal(card, 'defect'));
            this.elements.activeDefects.appendChild(miniCard);
        });

        // Установленные фичи
        this.elements.activeUpgrades.innerHTML = '';
        this.state.activeFeatures.forEach(feature => {
            const type = feature.isBroken ? 'broken' : 'feature';
            const miniCard = CardsManager.createMiniCard(feature, type);
// Для сломанной фичи открываем карточку сбоя
            if (feature.isBroken) {
                const crash = CardsManager.getCrashForFeature(feature.id);
                if (crash) {
                    miniCard.addEventListener('click', () => this.showCardModal(crash, 'defect'));
                } else {
                    miniCard.addEventListener('click', () => this.showCardModal(feature, 'feature'));
                }
            } else {
                miniCard.addEventListener('click', () => this.showCardModal(feature, 'feature'));
            }
            this.elements.activeUpgrades.appendChild(miniCard);
        });

        // Доступные фичи
        this.elements.availableUpgrades.innerHTML = '';
        this.state.availableFeatures.forEach(feature => {
            const miniCard = CardsManager.createMiniCard(feature, 'available');
            miniCard.addEventListener('click', () => this.showCardModal(feature, 'available'));
            this.elements.availableUpgrades.appendChild(miniCard);
        });

        // Джокеры
        if (this.elements.playerJokers) {
            this.elements.playerJokers.innerHTML = '';
            this.state.playerJokers.forEach(joker => {
                const miniCard = CardsManager.createMiniCard(joker, 'joker');
                miniCard.addEventListener('click', () => this.showCardModal(joker, 'joker'));
                this.elements.playerJokers.appendChild(miniCard);
            });
        }
    },

    /**
     * Завершить фазу / ход
     */
    endTurn() {
        switch (this.state.currentPhase) {
            case 'planning':
                this.state.currentPhase = 'dice_roll';
                this.addLog('🎲 Бросьте кубики!');
                break;
            case 'results':
                this.nextTurn();
                break;
        }
        this.updateUI();
    },

    /**
     * Бросок кубиков
     */
    rollDice() {
        if (this.state.currentPhase !== 'dice_roll') return;

        this.elements.dice1.classList.add('rolling');
        this.elements.dice2.classList.add('rolling');

        setTimeout(() => {
            this.state.diceRoll = [
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1
            ];

            this.elements.dice1.classList.remove('rolling');
            this.elements.dice2.classList.remove('rolling');

            const total = this.state.diceRoll[0] + this.state.diceRoll[1];
            const isDubble = this.state.diceRoll[0] === this.state.diceRoll[1];

            this.addLog(`🎲 Бросок: ${this.state.diceRoll[0]} + ${this.state.diceRoll[1]} = ${total}${isDubble ? ' (дубль!)' : ''}`);

            // Собираем события
            this.state.triggeredEvents = [];
            this.checkDefects(total);
            this.checkCrashes(total);
            this.checkFeatures(total, isDubble);

            this.showTriggeredEvents();

            this.state.currentPhase = 'results';
            this.updateUI();
        }, 500);
    },

    /**
     * Проверка дефектов
     */
    checkDefects(diceSum) {
        this.state.activeDefects.forEach(defect => {
            if (CardsManager.checkDiceRange(defect.diceLoss, diceSum)) {
                const loss = CardsManager.parseNumber(defect.loss);

                // Специальные эффекты
                if (defect.loss.includes('ОД')) {
                    this.state.actionPoints = Math.max(0, this.state.actionPoints - loss);
                    this.state.triggeredEvents.push({
                        type: 'defect',
                        name: defect.header,
                        message: defect.loss
                    });
                    this.addLog(`⚠️ "${defect.header}": ${defect.loss}`, 'danger');
                } else if (defect.loss.includes('ОМ')) {
                    this.state.missionPoints -= loss;
                    this.state.triggeredEvents.push({
                        type: 'defect',
                        name: defect.header,
                        message: defect.loss
                    });
                    this.addLog(`⚠️ "${defect.header}": ${defect.loss}`, 'danger');
                } else {
                    // Специальные эффекты (пропуск хода, минус фича, конец игры)
                    this.state.triggeredEvents.push({
                        type: 'defect',
                        name: defect.header,
                        message: defect.loss
                    });
                    this.addLog(`⚠️ "${defect.header}": ${defect.loss}`, 'warning');

                    if (defect.loss === 'Конец игры') {
                        this.state.missionPoints = 0;
                    }
                }
            }
        });
    },

    /**
     * Проверка сбоев
     */
    checkCrashes(diceSum) {
        this.state.activeCrashes.forEach(crash => {
            if (CardsManager.checkDiceRange(crash.diceLoss, diceSum)) {
                const loss = CardsManager.parseNumber(crash.loss);
                this.state.missionPoints -= loss;
                this.state.triggeredEvents.push({
                    type: 'crash',
                    name: crash.header,
                    message: crash.loss
                });
                this.addLog(`💥 Сбой "${crash.header}": ${crash.loss}`, 'danger');
            }
        });
    },

    /**
     * Проверка фич
     */
    checkFeatures(diceSum, isDubble) {
        this.state.activeFeatures.forEach(feature => {
            if (feature.isBroken) return;

            // Проверяем прибыль
            if (CardsManager.checkDiceRange(feature.diceProfit, diceSum)) {
                const profit = CardsManager.parseNumber(feature.profit);
                this.state.missionPoints += profit;
                this.state.triggeredEvents.push({
                    type: 'profit',
                    name: feature.header,
                    message: feature.profit
                });
                this.addLog(`✨ "${feature.header}": ${feature.profit}`, 'success');
            }

            // Проверяем поломку
            if (CardsManager.checkDiceRange(feature.diceLoss, diceSum)) {
                feature.isBroken = true;

                // Получаем соответствующий сбой
                const crash = CardsManager.getCrashForFeature(feature.id);
                if (crash) {
                    crash.isActive = true;
                    this.state.activeCrashes.push(crash);
                    this.state.triggeredEvents.push({
                        type: 'breakdown',
                        name: feature.header,
                        message: `Сбой: ${crash.header}`
                    });
                    this.addLog(`💥 "${feature.header}" сломалось! Сбой: ${crash.header}`, 'warning');
                }
            }
        });
    },

    /**
     * Показать события
     */
    showTriggeredEvents() {
        const oldNotification = document.querySelector('.event-notification');
        if (oldNotification) oldNotification.remove();

        if (this.state.triggeredEvents.length === 0) {
            const notification = document.createElement('div');
            notification.className = 'event-notification success';
            notification.innerHTML = `
                <div class="event-notification-content">
                    <div class="event-icon">✓</div>
                    <div class="event-title">Всё спокойно</div>
                </div>
            `;
            this.elements.shipArea.appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
            return;
        }

        let delay = 0;
        this.state.triggeredEvents.forEach(event => {
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.className = `event-notification ${event.type}`;
                const icon = event.type === 'profit' ? '💰' : event.type === 'breakdown' ? '💥' : '⚠️';
                notification.innerHTML = `
                    <div class="event-notification-content">
                        <div class="event-icon">${icon}</div>
                        <div class="event-title">${event.name}</div>
                        <div class="event-message">${event.message}</div>
                    </div>
                `;
                this.elements.shipArea.appendChild(notification);
                setTimeout(() => notification.classList.add('show'), 10);
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, 2000);
            }, delay);
            delay += 1200;
        });
    },

    /**
     * Следующий ход
     */
    nextTurn() {
        this.state.currentPlayerIndex++;

        if (this.state.currentPlayerIndex >= this.state.players.length) {
            this.state.currentPlayerIndex = 0;
            this.state.currentTurn++;

            if (this.state.currentTurn > this.state.maxTurns || this.state.missionPoints <= 0) {
                this.endGame();
                return;
            }

            this.addNewEvents();
            this.addLog(`📅 Ход ${this.state.currentTurn}`);
        }

        this.state.currentPhase = 'planning';
        this.state.actionPoints = 5;
        this.state.diceRoll = [0, 0];
        this.state.triggeredEvents = [];

        const player = this.state.players[this.state.currentPlayerIndex];
        this.addLog(`👤 ${player.name} берёт управление`);

        this.updateUI();
    },

    /**
     * Добавление новых событий в начале хода
     */
    addNewEvents() {
        // Новый дефект
        const existingIds = this.state.activeDefects.map(d => d.id);
        const newDefects = CardsManager.getRandomDefects(1, existingIds);
        if (newDefects.length > 0) {
            newDefects[0].isActive = true;
            this.state.activeDefects.push(newDefects[0]);
            this.addLog(`⚡ Новый дефект: "${newDefects[0].header}"`, 'warning');
        }

        // Новые фичи
        this.state.availableFeatures = [];
        const activeFeatureIds = this.state.activeFeatures.map(f => f.id);

        if (this.state.currentTurn >= 10) {
            const newFeatures = CardsManager.getRandomFeatures(2, activeFeatureIds);
            this.state.availableFeatures = newFeatures;

            const joker = CardsManager.getRandomJoker(this.state.usedJokerIds);
            if (joker) {
                this.state.playerJokers.push(joker);
                this.addLog(`🌟 Джокер: "${joker.header}"`, 'success');
            }
        } else {
            const newFeatures = CardsManager.getRandomFeatures(3, activeFeatureIds);
            this.state.availableFeatures = newFeatures;
        }
    },

    /**
     * Показать модальное окно карточки
     */
    showCardModal(card, type) {
        this.elements.modalCard.innerHTML = CardsManager.createCard(card);
        this.elements.modalActions.innerHTML = '';

        if (this.state.currentPhase === 'planning') {
            const cost = CardsManager.parseNumber(card.cost);

            if (type === 'defect' && card.id.startsWith('D')) {
                const canFix = this.state.actionPoints >= cost;
                const btn = document.createElement('button');
                btn.className = 'btn-action';
                btn.textContent = `Починить (${card.cost})`;
                btn.disabled = !canFix;
                btn.addEventListener('click', () => this.fixDefect(card));
                this.elements.modalActions.appendChild(btn);
            } else if (type === 'defect' && card.id.startsWith('C')) {
                const canFix = this.state.actionPoints >= cost;
                const btn = document.createElement('button');
                btn.className = 'btn-action';
                btn.textContent = `Устранить сбой (${card.cost})`;
                btn.disabled = !canFix;
                btn.addEventListener('click', () => this.fixCrash(card));
                this.elements.modalActions.appendChild(btn);
            } else if (type === 'feature' && card.isBroken) {
                const btn = document.createElement('button');
                btn.className = 'btn-action';
                btn.textContent = `Починить (${card.cost})`;
                btn.disabled = this.state.actionPoints < cost;
                btn.addEventListener('click', () => this.repairFeature(card));
                this.elements.modalActions.appendChild(btn);
            } else if (type === 'available') {
                const canInstall = this.state.actionPoints >= cost;
                const btn = document.createElement('button');
                btn.className = 'btn-action';
                btn.textContent = `Установить (${card.cost})`;
                btn.disabled = !canInstall;
                btn.addEventListener('click', () => this.installFeature(card));
                this.elements.modalActions.appendChild(btn);
            } else if (type === 'joker') {
                const btn = document.createElement('button');
                btn.className = 'btn-action joker-action';
                btn.textContent = '★ Использовать';
                btn.addEventListener('click', () => this.useJoker(card));
                this.elements.modalActions.appendChild(btn);
            }
        }

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = 'Закрыть';
        cancelBtn.addEventListener('click', () => this.closeModal());
        this.elements.modalActions.appendChild(cancelBtn);

        this.elements.modal.classList.add('active');
    },

    closeModal() {
        this.elements.modal.classList.remove('active');
    },

    openSectionModal(type, title, cards) {
        if (!cards || cards.length === 0) {
            this.addLog(`В секции "${title}" нет карточек`, 'warning');
            return;
        }

        this.elements.sectionModalTitle.textContent = title;
        this.elements.sectionModalCards.innerHTML = '';
        this.elements.sectionModal.className = `section-modal active ${type}`;

        cards.forEach(card => {
            const wrapper = document.createElement('div');
            wrapper.className = 'section-modal-card';

            // Если фича сломана - показываем сбой вместо фичи
            if (type === 'features' && card.isBroken) {
                const crash = CardsManager.getCrashForFeature(card.id);
                if (crash) {
                    wrapper.innerHTML = CardsManager.createCard(crash);
                    wrapper.classList.add('broken');
                } else {
                    wrapper.innerHTML = CardsManager.createCard(card);
                }
            } else {
                wrapper.innerHTML = CardsManager.createCard(card);
            }

            // Определяем карточку и тип для клика
            let clickCard = card;
            let clickType = type === 'defects' ? 'defect' : type;
            if (type === 'features' && card.isBroken) {
                const crashForClick = CardsManager.getCrashForFeature(card.id);
                if (crashForClick) {
                    clickCard = crashForClick;
                    clickType = 'defect';
                }
            }
            
            wrapper.addEventListener('click', () => {
                this.closeSectionModal();
                this.showCardModal(clickCard, clickType);
            });
            this.elements.sectionModalCards.appendChild(wrapper);
        });
    },

    closeSectionModal() {
        this.elements.sectionModal.classList.remove('active');
    },

    openRulesModal() {
        this.elements.rulesModal?.classList.add('active');
    },

    closeRulesModal() {
        this.elements.rulesModal?.classList.remove('active');
    },

    /**
     * Починить дефект
     */
    fixDefect(defect) {
        const cost = CardsManager.parseNumber(defect.cost);
        if (this.state.actionPoints < cost) return;

        this.state.actionPoints -= cost;
        this.state.activeDefects = this.state.activeDefects.filter(d => d.id !== defect.id);
        this.addLog(`🔧 Дефект "${defect.header}" устранён`, 'success');
        this.closeModal();
        this.updateUI();
    },

    /**
     * Устранить сбой
     */
    fixCrash(crash) {
        const cost = CardsManager.parseNumber(crash.cost);
        if (this.state.actionPoints < cost) return;

        this.state.actionPoints -= cost;
        this.state.activeCrashes = this.state.activeCrashes.filter(c => c.id !== crash.id);

        // Восстанавливаем соответствующую фичу
        const featureId = 'F' + crash.id.substring(1);
        const feature = this.state.activeFeatures.find(f => f.id === featureId);
        if (feature) {
            feature.isBroken = false;
        }

        this.addLog(`🔧 Сбой "${crash.header}" устранён`, 'success');
        this.closeModal();
        this.updateUI();
    },

    /**
     * Установить фичу
     */
    installFeature(feature) {
        const cost = CardsManager.parseNumber(feature.cost);
        if (this.state.actionPoints < cost) return;

        this.state.actionPoints -= cost;
        feature.isActive = true;
        feature.isBroken = false;
        this.state.activeFeatures.push(feature);
        this.state.availableFeatures = this.state.availableFeatures.filter(f => f.id !== feature.id);
        this.addLog(`⚙️ Фича "${feature.header}" установлена`, 'success');
        this.closeModal();
        this.updateUI();
    },

    /**
     * Починить фичу
     */
    repairFeature(feature) {
        const cost = CardsManager.parseNumber(feature.cost);
        if (this.state.actionPoints < cost) return;

        this.state.actionPoints -= cost;
        feature.isBroken = false;

        // Удаляем сбой
        const crashId = 'C' + feature.id.substring(1);
        this.state.activeCrashes = this.state.activeCrashes.filter(c => c.id !== crashId);

        this.addLog(`🔧 Фича "${feature.header}" починена`, 'success');
        this.closeModal();
        this.updateUI();
    },

    /**
     * Использовать джокер
     */
    useJoker(joker) {
        this.state.playerJokers = this.state.playerJokers.filter(j => j.id !== joker.id);
        this.state.usedJokerIds.push(joker.id);
        this.addLog(`🌟 Джокер "${joker.header}" использован!`, 'success');
        this.closeModal();
        this.updateUI();
    },

    /**
     * Добавить запись в лог
     */
    addLog(message, type = '') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        this.elements.logEntries.prepend(entry);

        while (this.elements.logEntries.children.length > 5) {
            this.elements.logEntries.removeChild(this.elements.logEntries.lastChild);
        }
    },

    /**
     * Завершить игру
     */
    endGame() {
        this.state.isGameOver = true;

        const score = this.state.missionPoints;
        this.elements.finalScore.textContent = score;

        let title, message;
        if (score >= 150) {
            title = '🏆 Блестящая победа!';
            message = 'Миссия выполнена идеально!';
        } else if (score >= 100) {
            title = '✨ Успешная миссия!';
            message = 'Хорошая работа, экипаж!';
        } else if (score >= 50) {
            title = '😓 Миссия завершена';
            message = 'С серьёзными потерями...';
        } else if (score > 0) {
            title = '⚠️ Критический результат';
            message = 'Экипаж едва выжил.';
        } else {
            title = '💀 Катастрофа';
            message = 'Корабль потерян.';
        }

        this.elements.gameOverTitle.textContent = title;
        this.elements.gameOverMessage.textContent = message;
        this.showScreen('game-over');
    },

    exitGame() {
        if (confirm('Выйти? Прогресс будет потерян.')) {
            this.showScreen('main-menu');
        }
    },

    showCardsViewer() {
        this.filterCards('all');
        this.showScreen('cards-viewer');
    },

    filterCards(filter) {
        this.elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.elements.cardsGrid.innerHTML = '';
        let cards = [];

        if (filter === 'all' || filter === 'defects') {
            cards = cards.concat(CardsManager.defects.map(c => ({ card: c, type: 'defect' })));
            cards = cards.concat(CardsManager.crashes.map(c => ({ card: c, type: 'crash' })));
        }
        if (filter === 'all' || filter === 'upgrades') {
            cards = cards.concat(CardsManager.features.map(c => ({ card: c, type: 'feature' })));
        }
        if (filter === 'all' || filter === 'jokers') {
            cards = cards.concat(CardsManager.jokers.map(c => ({ card: c, type: 'joker' })));
        }

        cards.forEach(({ card, type }) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'card-wrapper';
            wrapper.innerHTML = CardsManager.createCard(card);
            wrapper.addEventListener('click', () => this.showCardModal(card, type));
            this.elements.cardsGrid.appendChild(wrapper);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
