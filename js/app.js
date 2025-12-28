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
        availableJokers: [],      // Доступные для взятия джокеры
        playerJokers: [],         // Джокеры на руках
        usedJokerIds: [],
        usedDefectIds: [],        // ID использованных дефектов
        shownFeatureIds: [],      // ID фичей, которые уже выпадали в текущей "эпохе"
        jokersGiven: false,       // Были ли выданы джокеры на 10-м ходу
        isGameOver: false,
        triggeredEvents: [],
        noProfitThisTurn: false,   // Флаг "Ход без прибыли"
        skipNextTurn: false,       // Флаг "Пропуск хода"
        j02Used: false,            // J02 использован в этом ходу
        j05Used: false,            // J05 использован в этом ходу
        j01BonusNextTurn: false,   // J01: +1 ОД на следующий ход
        j01SkipNextTurn: false,    // J01: пропуск хода (0 ОД) на следующий ход
        j03BonusNextTurn: false,   // J03 бонус активируется на след. ход
        j03BonusActive: false      // J03 бонус активен (даёт +1 ОД за дефект)
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
        this.setPlayerCount(1);  // По умолчанию 1 игрок
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
            diceCube1: document.querySelector('#dice-1 .dice-cube'),
            diceCube2: document.querySelector('#dice-2 .dice-cube'),
            diceTotal: document.getElementById('dice-total'),
            jokerActions: document.getElementById('joker-actions'),
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

        // Клики по секциям (вся область, кроме мини-карточек)
        this.elements.defectsSection?.addEventListener('click', (e) => {
            // Игнорируем клики на мини-карточках (у них свой обработчик)
            if (e.target.closest('.mini-card')) return;
            const allDefectsAndCrashes = [...this.state.activeDefects, ...this.state.activeCrashes];
            this.openSectionModal('defects', 'Активные дефекты и сбои', allDefectsAndCrashes);
        });
        this.elements.upgradesSection?.addEventListener('click', (e) => {
            if (e.target.closest('.mini-card')) return;
            this.openSectionModal('features', 'Установленные фичи', this.state.activeFeatures);
        });
        this.elements.availableSection?.addEventListener('click', (e) => {
            if (e.target.closest('.mini-card')) return;
            this.openSectionModal('available', 'Доступные фичи', this.state.availableFeatures);
        });
        this.elements.jokersSection?.addEventListener('click', (e) => {
            if (e.target.closest('.mini-card')) return;
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
        this.state.usedDefectIds = [];
        this.state.shownFeatureIds = [];
        this.state.jokersGiven = false;
        this.state.triggeredEvents = [];
        this.state.noProfitThisTurn = false;
        this.state.skipNextTurn = false;
        this.state.j01BonusNextTurn = false;
        this.state.j01SkipNextTurn = false;
        this.state.j03BonusNextTurn = false;
        this.state.j03BonusActive = false;

        // Начальные карточки
        this.state.activeDefects = CardsManager.getRandomDefects(1);
        this.state.activeDefects.forEach(d => {
            d.isActive = true;
            this.state.usedDefectIds.push(d.id);
        });
        this.state.activeFeatures = [];
        this.state.activeCrashes = [];

        // Начальные доступные фичи
        this.state.availableFeatures = CardsManager.getRandomFeatures(3);
        this.state.availableFeatures.forEach(f => this.state.shownFeatureIds.push(f.id));

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

        // Кубики (3D)
        if (this.state.diceRoll[0]) {
            this.elements.diceCube1.setAttribute('data-value', this.state.diceRoll[0]);
        }
        if (this.state.diceRoll[1]) {
            this.elements.diceCube2.setAttribute('data-value', this.state.diceRoll[1]);
        }
        const total = this.state.diceRoll[0] + this.state.diceRoll[1];
        this.elements.diceTotal.innerHTML = total ? `<span>${total}</span>` : '<span>?</span>';

        // Кнопки
        const isLastTurn = this.state.currentTurn >= this.state.maxTurns;
        const isGameOver = this.state.isGameOver;

        // Если игра окончена - блокируем все кнопки
        if (isGameOver) {
            this.elements.rollDiceBtn.disabled = true;
            this.elements.endTurnBtn.disabled = true;
            this.elements.endTurnBtn.textContent = '🏁 Игра завершена';
        } else if (this.state.currentPhase === 'planning') {
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
            // На последнем ходу показываем кнопку завершения
            this.elements.endTurnBtn.textContent = isLastTurn
                ? '🏁 Завершить миссию'
                : 'Следующий ход →';
        }

        this.renderCards();
        this.renderJokerActions();
    },

    /**
     * Рендер кнопок интерактивных джокеров (J05)
     * J02 теперь обрабатывается сразу после броска кубиков
     */
    renderJokerActions() {
        if (!this.elements.jokerActions) return;
        this.elements.jokerActions.innerHTML = '';

        // Показываем только в фазе results
        if (this.state.currentPhase !== 'results') return;

        // J05 - Система Мёбиус (убрать дефект)
        if (this.canUseJ05()) {
            const availableDefects = this.getJ05AvailableDefects();
            if (availableDefects.length > 0) {
                availableDefects.forEach(defect => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-joker-action';
                    btn.innerHTML = `🃏 Убрать "${defect.header}"`;
                    btn.addEventListener('click', () => this.useJ05RemoveDefect(defect));
                    this.elements.jokerActions.appendChild(btn);
                });
            }
        }
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

        // Джокеры (на руках + доступные для взятия)
        if (this.elements.playerJokers) {
            this.elements.playerJokers.innerHTML = '';

            // Доступные для взятия джокеры
            this.state.availableJokers.forEach(joker => {
                const miniCard = CardsManager.createMiniCard(joker, 'available-joker');
                miniCard.classList.add('available-joker');
                miniCard.addEventListener('click', () => this.showCardModal(joker, 'available-joker'));
                this.elements.playerJokers.appendChild(miniCard);
            });

            // Джокеры на руках
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
        // Блокируем действия если игра окончена
        if (this.state.isGameOver) return;

        switch (this.state.currentPhase) {
            case 'planning':
                this.state.currentPhase = 'dice_roll';
                this.addLog('🎲 Бросьте кубики!');
                break;
            case 'results':
                // На последнем ходу сразу завершаем игру
                if (this.state.currentTurn >= this.state.maxTurns) {
                    this.endGame();
                    return;
                }
                this.nextTurn();
                break;
        }
        this.updateUI();
    },

    /**
     * Бросок кубиков
     */
    rollDice() {
        if (this.state.isGameOver) return;
        if (this.state.currentPhase !== 'dice_roll') return;

        // Блокируем повторный бросок
        this.elements.rollDiceBtn.disabled = true;

        // Сбрасываем предыдущее значение и запускаем вращение
        this.elements.diceCube1.removeAttribute('data-value');
        this.elements.diceCube2.removeAttribute('data-value');
        this.elements.diceCube1.classList.add('rolling');
        this.elements.diceCube2.classList.add('rolling');
        this.elements.diceTotal.innerHTML = '<span>?</span>';

        // Анимация вращения 800мс
        setTimeout(() => {
            this.state.diceRoll = [
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1
            ];

            // Убираем вращение
            this.elements.diceCube1.classList.remove('rolling');
            this.elements.diceCube2.classList.remove('rolling');

            // Устанавливаем значения (CSS повернёт кубик на нужную грань)
            this.elements.diceCube1.setAttribute('data-value', this.state.diceRoll[0]);
            this.elements.diceCube2.setAttribute('data-value', this.state.diceRoll[1]);

            // Эффект приземления
            this.elements.dice1.classList.add('landed');
            this.elements.dice2.classList.add('landed');

            setTimeout(() => {
                this.elements.dice1.classList.remove('landed');
                this.elements.dice2.classList.remove('landed');
            }, 300);

            const isDubble = this.state.diceRoll[0] === this.state.diceRoll[1];
            const total = this.state.diceRoll[0] + this.state.diceRoll[1];

            // Обновляем сумму
            this.elements.diceTotal.innerHTML = `<span>${total}</span>`;
            this.addLog(`🎲 Бросок: ${this.state.diceRoll[0]} + ${this.state.diceRoll[1]} = ${total}${isDubble ? ' (дубль!)' : ''}`);

            // Проверяем наличие J02 "Модуль квантовой удачи"
            const j02 = this.state.playerJokers.find(j => j.id === 'J02');
            if (j02) {
                if (isDubble) {
                    // При дубле: автоматически убираем один кубик
                    this.applyJ02Double();
                } else {
                    // При не-дубле: показываем выбор
                    this.showJ02Choice();
                    return; // processRollResults будет вызван после выбора
                }
            }

            // Продолжаем проверки
            this.processRollResults();
        }, 800);
    },

    /**
     * J02: Автоматически убираем один кубик при дубле
     */
    applyJ02Double() {
        const removedDice = this.state.diceRoll[1]; // Убираем второй кубик
        this.state.diceRoll[1] = 0;

        // Визуально скрываем второй кубик
        this.elements.diceCube2.setAttribute('data-value', '');
        this.elements.dice2.style.opacity = '0.3';

        const newTotal = this.state.diceRoll[0];
        this.elements.diceTotal.innerHTML = `<span>${newTotal}</span>`;

        this.addLog(`🃏 Модуль квантовой удачи: дубль! Кубик убран (${removedDice}→0), сумма = ${newTotal}`, 'warning');
    },

    /**
     * J02: Показать выбор при не-дубле
     */
    showJ02Choice() {
        const modal = document.getElementById('j02-modal');
        const dice1El = document.getElementById('j02-dice-1');
        const dice2El = document.getElementById('j02-dice-2');
        const totalEl = document.getElementById('j02-total');
        const textEl = document.getElementById('j02-modal-text');
        const buttonsEl = document.getElementById('j02-buttons');

        // Заполняем данные
        dice1El.textContent = this.state.diceRoll[0];
        dice2El.textContent = this.state.diceRoll[1];
        totalEl.textContent = this.state.diceRoll[0] + this.state.diceRoll[1];
        textEl.textContent = 'Выберите кубик для переброса или продолжите без изменений:';

        // Создаём кнопки
        buttonsEl.innerHTML = `
            <button class="btn-j02" data-action="reroll-1">🎲 Перебросить кубик 1 (${this.state.diceRoll[0]})</button>
            <button class="btn-j02" data-action="reroll-2">🎲 Перебросить кубик 2 (${this.state.diceRoll[1]})</button>
            <button class="btn-j02 btn-j02-skip" data-action="skip">Не перебрасывать →</button>
        `;

        // Показываем модал
        modal.classList.add('active');

        // Обработчики кнопок
        buttonsEl.querySelectorAll('.btn-j02').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                modal.classList.remove('active');

                if (action === 'reroll-1') {
                    this.j02RerollDice(0);
                } else if (action === 'reroll-2') {
                    this.j02RerollDice(1);
                } else {
                    this.addLog('🃏 Модуль квантовой удачи: кубики не перебрасываются', 'info');
                    this.processRollResults();
                }
            });
        });
    },

    /**
     * J02: Перебросить один кубик
     */
    j02RerollDice(diceIndex) {
        const oldValue = this.state.diceRoll[diceIndex];
        const newValue = Math.floor(Math.random() * 6) + 1;
        this.state.diceRoll[diceIndex] = newValue;

        // Анимация переброса
        const diceCube = diceIndex === 0 ? this.elements.diceCube1 : this.elements.diceCube2;
        diceCube.classList.add('rolling');

        setTimeout(() => {
            diceCube.classList.remove('rolling');
            diceCube.setAttribute('data-value', newValue);

            const total = this.state.diceRoll[0] + this.state.diceRoll[1];
            this.elements.diceTotal.innerHTML = `<span>${total}</span>`;

            this.addLog(`🃏 Модуль квантовой удачи: кубик ${diceIndex + 1} переброшен (${oldValue} → ${newValue}), сумма = ${total}`, 'success');

            // Продолжаем проверки
            this.processRollResults();
        }, 500);
    },

    /**
     * Обработка результатов броска (проверка всех карт)
     */
    processRollResults() {
        // Восстанавливаем видимость второго кубика (если был скрыт J02)
        this.elements.dice2.style.opacity = '1';

        const total = this.state.diceRoll[0] + this.state.diceRoll[1];
        const isDubble = this.state.diceRoll[0] === this.state.diceRoll[1] && this.state.diceRoll[1] !== 0;

        // Сбрасываем флаг "Ход без прибыли" перед проверками
        this.state.noProfitThisTurn = false;

        // Собираем события
        this.state.triggeredEvents = [];

        // ВАЖНО: Сначала проверяем D15 "Перегрузка энергоядра" - он влияет на прибыль от фич
        this.checkEnergyOverload(total);

        this.checkDefects(total);
        this.checkCrashes(total);
        this.checkFeatures(total, isDubble);
        this.checkJokers(total, isDubble); // Постоянные эффекты джокеров

        this.showTriggeredEvents();

        this.state.currentPhase = 'results';
        this.updateUI();
    },

    /**
     * Проверка D15 "Перегрузка энергоядра" - должна быть до фич!
     * При срабатывании блокирует прибыль от фич в этот ход
     */
    checkEnergyOverload(diceSum) {
        const d15 = this.state.activeDefects.find(d => d.id === 'D15');
        if (!d15) return;

        if (CardsManager.checkDiceRange(d15.diceLoss, diceSum)) {
            // Устанавливаем флаг ДО проверки фич
            this.state.noProfitThisTurn = true;

            this.state.triggeredEvents.push({
                type: 'defect',
                name: d15.header,
                message: d15.loss + ' (фичи не принесут ОМ)',
                pointsChange: 0,
                special: 'no_profit'
            });

            this.addLog(`⚠️ ${d15.header}: ${d15.loss}`, 'danger');
        }
    },

    /**
     * Проверка дефектов
     */
    checkDefects(diceSum) {
        this.state.activeDefects.forEach(defect => {
            // Пропускаем "всегда" - они обрабатываются в начале хода
            if (defect.diceLoss === 'всегда') return;

            // Пропускаем D15 - он обрабатывается отдельно в checkEnergyOverload()
            if (defect.id === 'D15') return;

            if (CardsManager.checkDiceRange(defect.diceLoss, diceSum)) {
                const loss = CardsManager.parseNumber(defect.loss);

                // Специальные эффекты
                if (defect.loss.includes('ОД')) {
                    this.state.triggeredEvents.push({
                        type: 'defect',
                        name: defect.header,
                        message: defect.loss,
                        pointsChange: 0,
                        actionPointsChange: -loss
                    });
                } else if (defect.loss.includes('ОМ')) {
                    this.state.triggeredEvents.push({
                        type: 'defect',
                        name: defect.header,
                        message: defect.loss,
                        pointsChange: -loss
                    });
                } else {
                    // Специальные эффекты
                    let pointsChange = 0;
                    let special = null;

                    if (defect.loss === 'Конец игры') {
                        special = 'end_game';
                    } else if (defect.loss === 'Ход без прибыли') {
                        special = 'no_profit';
                    } else if (defect.loss === 'Минус фича') {
                        special = 'lose_feature';
                    } else if (defect.loss === 'Пропуск хода') {
                        special = 'skip_turn';
                    }

                    this.state.triggeredEvents.push({
                        type: 'defect',
                        name: defect.header,
                        message: defect.loss,
                        pointsChange: pointsChange,
                        special: special
                    });
                }
            }
        });
    },

    /**
     * Проверка сбоев
     */
    checkCrashes(diceSum) {
        this.state.activeCrashes.forEach(crash => {
            // Пропускаем "всегда" - они обрабатываются в начале хода
            if (crash.diceLoss === 'всегда') return;

            if (CardsManager.checkDiceRange(crash.diceLoss, diceSum)) {
                const loss = CardsManager.parseNumber(crash.loss);
                this.state.triggeredEvents.push({
                    type: 'crash',
                    name: crash.header,
                    message: crash.loss,
                    pointsChange: -loss
                });
            }
        });
    },

    /**
     * Проверка фич
     */
    checkFeatures(diceSum, isDubble) {
        this.state.activeFeatures.forEach(feature => {
            if (feature.isBroken) return;

            // Проверяем прибыль (если не действует "Ход без прибыли")
            if (!this.state.noProfitThisTurn && CardsManager.checkDiceRange(feature.diceProfit, diceSum)) {
                // Для фич прибыль хранится в поле loss (особенность CSV)
                const profit = CardsManager.parseNumber(feature.loss);
                this.state.triggeredEvents.push({
                    type: 'profit',
                    name: feature.header,
                    message: feature.loss,
                    pointsChange: +profit
                });
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
                        message: `Сбой: ${crash.header}`,
                        pointsChange: 0
                    });
                }
            }
        });
    },

    /**
     * Проверка эффектов джокеров на руках
     */
    checkJokers(diceSum, isDubble) {
        // Считаем количество сработавших улучшений и общий доход для J04
        const profitEvents = this.state.triggeredEvents.filter(e => e.type === 'profit');
        const profitCount = profitEvents.length;
        const totalProfit = profitEvents.reduce((sum, e) => sum + (e.pointsChange || 0), 0);

        this.state.playerJokers.forEach(joker => {
            switch (joker.id) {
                case 'J01': // ИИ приоритизация: +1 ОД на СЛЕД. ход при 1-6,8-12; 0 ОД на СЛЕД. ход при 7
                    if (CardsManager.checkDiceRange(joker.diceProfit, diceSum)) {
                        // Бонус применится на следующий ход
                        this.state.j01BonusNextTurn = true;
                        this.state.triggeredEvents.push({
                            type: 'joker_bonus',
                            name: joker.header,
                            message: '+1 ОД на следующий ход',
                            pointsChange: 0
                        });
                    } else if (CardsManager.checkDiceRange(joker.diceLoss, diceSum)) {
                        // Штраф применится на следующий ход
                        this.state.j01SkipNextTurn = true;
                        this.state.triggeredEvents.push({
                            type: 'joker_penalty',
                            name: joker.header,
                            message: 'ИИ спорит — 0 ОД на следующий ход!',
                            pointsChange: 0
                        });
                    }
                    break;

                case 'J04': // Реактор-резонатор: +1 ОМ за улучшение / -50% дохода при 7
                    if (CardsManager.checkDiceRange(joker.diceLoss, diceSum)) {
                        // При 7: теряется половина дохода ОМ за ход
                        if (totalProfit > 0) {
                            const halfProfit = Math.floor(totalProfit / 2);
                            this.state.triggeredEvents.push({
                                type: 'joker_penalty',
                                name: joker.header,
                                message: `-${halfProfit} ОМ (половина дохода)`,
                                pointsChange: -halfProfit
                            });
                        }
                    } else if (profitCount > 0 && CardsManager.checkDiceRange(joker.diceProfit, diceSum)) {
                        // При остальных: +1 ОМ за каждое сработавшее улучшение
                        this.state.triggeredEvents.push({
                            type: 'joker_bonus',
                            name: joker.header,
                            message: `+${profitCount} ОМ (за ${profitCount} улучш.)`,
                            pointsChange: +profitCount
                        });
                    }
                    break;

                case 'J03': // Интерфейс боевого духа: +1 ОД за дефект (2-5,7-11) / +1 дефект (6,12)
                    if (CardsManager.checkDiceRange(joker.diceLoss, diceSum)) {
                        // При 6 или 12: добавляется случайный дефект
                        this.state.triggeredEvents.push({
                            type: 'joker_penalty',
                            name: joker.header,
                            message: '+1 случайный дефект!',
                            pointsChange: 0,
                            special: 'add_defect'
                        });
                    } else if (CardsManager.checkDiceRange(joker.diceProfit, diceSum)) {
                        // При 2-5, 7-11: бонус +1 ОД за устранение дефекта на СЛЕДУЮЩИЙ ход
                        this.state.j03BonusNextTurn = true;
                        this.state.triggeredEvents.push({
                            type: 'joker_bonus',
                            name: joker.header,
                            message: '+1 ОД за каждый дефект (след. ход)',
                            pointsChange: 0
                        });
                    }
                    break;
            }
        });
    },


    /**
     * Проверка доступности J05 (убрать дефект)
     */
    canUseJ05() {
        if (this.state.j05Used) return false;
        const j05 = this.state.playerJokers.find(j => j.id === 'J05');
        if (!j05) return false;
        // J05 работает при чётном броске
        const total = this.state.diceRoll[0] + this.state.diceRoll[1];
        return total % 2 === 0 && total > 0;
    },

    /**
     * Получить доступные дефекты для J05 (только EASY и MEDIUM)
     */
    getJ05AvailableDefects() {
        return this.state.activeDefects.filter(d => {
            const template = d.template || '';
            return template.includes('EASY') || template.includes('MEDIUM');
        });
    },

    /**
     * Использовать J05 - убрать лёгкий/средний дефект
     */
    useJ05RemoveDefect(defect) {
        if (!this.canUseJ05()) return;

        this.state.j05Used = true;
        this.state.activeDefects = this.state.activeDefects.filter(d => d.id !== defect.id);
        this.addLog(`🃏 Система Мёбиус: дефект "${defect.header}" устранён!`, 'success');
        this.closeModal();
        this.updateUI();
    },

    /**
     * Показать события и применить изменения ОМ синхронно
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
                // Применяем изменение ОМ
                if (event.pointsChange) {
                    this.state.missionPoints += event.pointsChange;
                    this.animateMissionPoints(event.pointsChange);
                }

                // Применяем изменение ОД
                if (event.actionPointsChange) {
                    this.state.actionPoints = Math.max(0, this.state.actionPoints + event.actionPointsChange);
                }

                // Обрабатываем специальные эффекты
                if (event.special) {
                    switch (event.special) {
                        case 'end_game':
                            this.state.missionPoints = 0;
                            this.animateMissionPoints(-999);
                            break;
                        case 'no_profit':
                            this.state.noProfitThisTurn = true;
                            break;
                        case 'lose_feature':
                            this.removeRandomFeature();
                            break;
                        case 'skip_turn':
                            this.state.skipNextTurn = true;
                            break;
                        case 'add_defect':
                            // J03: добавляем случайный дефект
                            this.addRandomDefect();
                            break;
                    }
                }

                // Добавляем в лог
                const logType = (event.type === 'profit' || event.type === 'joker_bonus') ? 'success' :
                               (event.type === 'breakdown' || event.type === 'crash' || event.type === 'joker_penalty') ? 'danger' : 'warning';
                const logIcon = event.type === 'profit' ? '✨' :
                               event.type === 'joker_bonus' ? '🃏' :
                               event.type === 'joker_penalty' ? '🃏' :
                               event.type === 'breakdown' ? '💥' :
                               event.type === 'crash' ? '💥' : '⚠️';
                this.addLog(`${logIcon} "${event.name}": ${event.message}`, logType);

                // Обновляем UI (ОМ, ОД)
                this.elements.missionPoints.textContent = this.state.missionPoints;
                this.elements.actionPoints.textContent = this.state.actionPoints;

                // Показываем уведомление
                const notification = document.createElement('div');
                notification.className = `event-notification ${event.type}`;
                const icon = event.type === 'profit' ? '💰' :
                            event.type === 'joker_bonus' ? '🃏' :
                            event.type === 'joker_penalty' ? '🃏' :
                            event.type === 'breakdown' ? '💥' : '⚠️';

                // Показываем изменение очков в уведомлении
                let pointsIndicator = '';
                if (event.pointsChange && event.pointsChange !== 0) {
                    const sign = event.pointsChange > 0 ? '+' : '';
                    const colorClass = event.pointsChange > 0 ? 'points-up' : 'points-down';
                    pointsIndicator = `<div class="event-points ${colorClass}">${sign}${event.pointsChange} ОМ</div>`;
                }

                notification.innerHTML = `
                    <div class="event-notification-content">
                        <div class="event-icon">${icon}</div>
                        <div class="event-title">${event.name}</div>
                        <div class="event-message">${event.message}</div>
                        ${pointsIndicator}
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
     * Анимация изменения ОМ
     */
    animateMissionPoints(change) {
        const element = this.elements.missionPoints;
        if (!element) return;

        // Добавляем класс анимации
        element.classList.remove('points-flash-up', 'points-flash-down');
        void element.offsetWidth; // Форсируем reflow для перезапуска анимации

        if (change > 0) {
            element.classList.add('points-flash-up');
        } else {
            element.classList.add('points-flash-down');
        }

        // Убираем класс после анимации
        setTimeout(() => {
            element.classList.remove('points-flash-up', 'points-flash-down');
        }, 600);
    },

    /**
     * Следующий ход
     */
    nextTurn() {
        // Блокируем если игра окончена
        if (this.state.isGameOver) return;

        // Проверка на окончание игры (ОМ <= 0)
        if (this.state.missionPoints <= 0) {
            this.endGame();
            return;
        }

        // Обработка "Пропуск хода" (D20 Квантовый резонанс двигателя)
        const isSkippedTurn = this.state.skipNextTurn;
        if (isSkippedTurn) {
            this.state.skipNextTurn = false;
            this.addLog("⏭️ Ход пропущен из-за дефекта! (0 ОД)", "warning");
        }

        // J01 ИИ приоритизация: эффекты на этот ход
        const j01Bonus = this.state.j01BonusNextTurn;
        const j01Skip = this.state.j01SkipNextTurn;
        this.state.j01BonusNextTurn = false;
        this.state.j01SkipNextTurn = false;

        this.state.currentPlayerIndex++;

        if (this.state.currentPlayerIndex >= this.state.players.length) {
            this.state.currentPlayerIndex = 0;
            this.state.currentTurn++;

            this.addNewEvents();
            this.addLog(`📅 Ход ${this.state.currentTurn}`);
        }

        this.state.currentPhase = 'planning';

        // Расчёт ОД на этот ход
        // Приоритет: D20 пропуск > J01 пропуск > J01 бонус
        if (isSkippedTurn) {
            this.state.actionPoints = 0;
        } else if (j01Skip) {
            this.state.actionPoints = 0;
            this.addLog('🃏 ИИ приоритизация: ИИ спорит и блокирует интерфейсы (0 ОД)', 'danger');
        } else if (j01Bonus) {
            this.state.actionPoints = 6; // 5 + 1
            this.addLog('🃏 ИИ приоритизация: ИИ помогает экипажу (+1 ОД)', 'success');
        } else {
            this.state.actionPoints = 5;
        }

        this.state.diceRoll = [0, 0];
        this.state.triggeredEvents = [];
        this.state.noProfitThisTurn = false;
        this.state.j02Used = false;
        this.state.j05Used = false;

        // J03: переносим бонус с прошлого хода
        this.state.j03BonusActive = this.state.j03BonusNextTurn;
        this.state.j03BonusNextTurn = false;
        if (this.state.j03BonusActive) {
            this.addLog('🃏 Интерфейс боевого духа: +1 ОД за каждый устранённый дефект!', 'success');
        }

        // Применяем постоянные эффекты (дефекты/сбои с "всегда") в начале хода
        this.applyPermanentEffects();

        const player = this.state.players[this.state.currentPlayerIndex];
        this.addLog(`👤 ${player.name} берёт управление`);

        this.updateUI();
    },

    /**
     * Применение постоянных эффектов в начале хода
     * Для дефектов и сбоев с триггером "всегда"
     */
    applyPermanentEffects() {
        // Проверяем активные дефекты
        this.state.activeDefects.forEach(defect => {
            if (defect.diceLoss === 'всегда') {
                this.applyPermanentEffect(defect, 'defect');
            }
        });

        // Проверяем активные сбои
        this.state.activeCrashes.forEach(crash => {
            if (crash.diceLoss === 'всегда') {
                this.applyPermanentEffect(crash, 'crash');
            }
        });
    },

    /**
     * Применить постоянный эффект карты
     */
    applyPermanentEffect(card, type) {
        const loss = card.loss;

        if (loss.includes('ОД')) {
            const amount = CardsManager.parseNumber(loss);
            this.state.actionPoints = Math.max(0, this.state.actionPoints - amount);
            this.addLog(`⚠️ "${card.header}": ${loss} (постоянный эффект)`, 'warning');
        } else if (loss.includes('ОМ')) {
            const amount = CardsManager.parseNumber(loss);
            this.state.missionPoints -= amount;
            this.addLog(`⚠️ "${card.header}": ${loss} (постоянный эффект)`, 'danger');
        }
        // Специальные эффекты типа "Ход без прибыли" обрабатываются в checkDefects
    },

    /**
     * Добавление новых событий в начале хода
     */
    addNewEvents() {
        // Собираем все использованные ID дефектов
        const allUsedDefectIds = [
            ...this.state.usedDefectIds,
            ...this.state.activeDefects.map(d => d.id),
            ...this.state.activeCrashes.map(c => c.id)
        ];

        // Очищаем доступные джокеры с прошлого хода
        this.state.availableJokers = [];

        // На 10-м ходу - ТОЛЬКО джокеры (вместо дефектов и улучшений)
        if (this.state.currentTurn === 10 && !this.state.jokersGiven) {
            // Очищаем доступные фичи
            this.state.availableFeatures = [];

            // Предлагаем 3 джокера для выбора
            this.addLog(`🎰 Особый ход! Выберите джокеры!`, 'success');
            const tempUsedIds = [...this.state.usedJokerIds];
            for (let i = 0; i < 3; i++) {
                const joker = CardsManager.getRandomJoker(tempUsedIds);
                if (joker) {
                    this.state.availableJokers.push(joker);
                    tempUsedIds.push(joker.id); // Исключаем из следующего выбора
                    this.addLog(`🃏 Доступен джокер: "${joker.header}"`, 'success');
                }
            }
            this.state.jokersGiven = true;
            return; // Не добавляем дефекты и фичи на этом ходу
        }

        // Обычный ход - дефекты и улучшения

        // Новый дефект (исключаем все уже использованные)
        const newDefects = CardsManager.getRandomDefects(1, allUsedDefectIds);
        if (newDefects.length > 0) {
            newDefects[0].isActive = true;
            this.state.activeDefects.push(newDefects[0]);
            this.state.usedDefectIds.push(newDefects[0].id);
            this.addLog(`⚡ Новый дефект: "${newDefects[0].header}"`, 'warning');
        }

        // Очищаем доступные фичи прошлого хода (они возвращаются в колоду)
        this.state.availableFeatures = [];

        // Генерация 3 новых фичей с учётом колоды
        this.generateNewFeatures(3);
    },

    /**
     * Генерация новых фичей с учётом колоды и перетасовки
     */
    generateNewFeatures(count) {
        const newFeatures = [];

        // ID фичей, которые нельзя брать: установленные + уже показанные в этой эпохе
        const installedIds = this.state.activeFeatures.map(f => f.id);
        let excludeIds = [...installedIds, ...this.state.shownFeatureIds];

        // Пытаемся набрать нужное количество фичей
        let available = CardsManager.getRandomFeatures(count, excludeIds);
        newFeatures.push(...available);

        // Если не хватает карточек - перетасовываем колоду
        if (newFeatures.length < count) {
            const remaining = count - newFeatures.length;
            this.addLog(`🔄 Колода улучшений перетасована!`, 'success');

            // Сбрасываем показанные (кроме установленных и только что добавленных)
            this.state.shownFeatureIds = [];

            // Исключаем только установленные и уже добавленные в этот ход
            const newExcludeIds = [...installedIds, ...newFeatures.map(f => f.id)];
            const moreFeatures = CardsManager.getRandomFeatures(remaining, newExcludeIds);
            newFeatures.push(...moreFeatures);
        }

        // Добавляем в показанные
        newFeatures.forEach(f => this.state.shownFeatureIds.push(f.id));

        this.state.availableFeatures = newFeatures;
    },

    /**
     * Показать модальное окно карточки
     */
    showCardModal(card, type) {
        this.elements.modalCard.innerHTML = CardsManager.createCard(card);
        this.elements.modalActions.innerHTML = '';

        // Показываем подсказку если не фаза планирования
        if (this.state.currentPhase !== 'planning') {
            const hint = document.createElement('div');
            hint.className = 'modal-hint';
            hint.textContent = '💡 Действия доступны только в фазе "Действия"';
            this.elements.modalActions.appendChild(hint);
        }

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
            } else if (type === 'available-joker') {
                // Джокер доступен для взятия на руку
                const takeCost = 4; // Взять джокер стоит 4 ОД
                const canTake = this.state.actionPoints >= takeCost;
                const btn = document.createElement('button');
                btn.className = 'btn-action joker-action';
                btn.textContent = `🃏 Взять на руку (${takeCost} ОД)`;
                btn.disabled = !canTake;
                btn.addEventListener('click', () => this.takeJoker(card));
                this.elements.modalActions.appendChild(btn);
            } else if (type === 'joker') {
                // Джокер на руках - можно использовать
                const jokerCost = CardsManager.parseNumber(card.cost);
                const canUse = this.state.actionPoints >= jokerCost;
                const btn = document.createElement('button');
                btn.className = 'btn-action joker-action';
                btn.textContent = `★ Использовать (${card.cost})`;
                btn.disabled = !canUse;
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
            // Конвертируем множественное число в единственное для типов
            let clickType = type;
            if (type === 'defects') clickType = 'defect';
            else if (type === 'features') clickType = 'feature';
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

        // J03 бонус: +1 ОД при устранении дефекта (активен на этом ходу)
        if (this.state.j03BonusActive) {
            this.state.actionPoints += 1;
            this.addLog(`🃏 Интерфейс боевого духа: +1 ОД за устранение дефекта!`, 'success');
        }

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
     * Взять джокер на руку
     */
    takeJoker(joker) {
        const cost = 4; // Взять джокер стоит 4 ОД

        if (this.state.actionPoints < cost) {
            this.addLog(`❌ Недостаточно ОД для взятия джокера`, 'warning');
            return;
        }

        // Списываем ОД
        this.state.actionPoints -= cost;

        // Убираем из доступных
        this.state.availableJokers = this.state.availableJokers.filter(j => j.id !== joker.id);

        // Добавляем на руку
        this.state.playerJokers.push(joker);
        this.state.usedJokerIds.push(joker.id);

        this.addLog(`🃏 Джокер "${joker.header}" взят на руку (-${cost} ОД)`, 'success');
        this.closeModal();
        this.updateUI();
    },

    /**
     * Использовать джокер
     */
    useJoker(joker) {
        const cost = CardsManager.parseNumber(joker.cost);

        // Проверяем, хватает ли ОД
        if (this.state.actionPoints < cost) {
            this.addLog(`❌ Недостаточно ОД для джокера (нужно ${cost})`, 'warning');
            return;
        }

        // Списываем ОД
        this.state.actionPoints -= cost;

        this.state.playerJokers = this.state.playerJokers.filter(j => j.id !== joker.id);
        this.state.usedJokerIds.push(joker.id);
        this.addLog(`🌟 Джокер "${joker.header}" использован! (-${cost} ОД)`, 'success');
        this.closeModal();
        this.updateUI();
    },

    /**
     * Добавить случайный дефект (эффект J03 "Интерфейс боевого духа")
     */
    addRandomDefect() {
        // Собираем все использованные ID дефектов
        const allUsedDefectIds = [
            ...this.state.usedDefectIds,
            ...this.state.activeDefects.map(d => d.id),
            ...this.state.activeCrashes.map(c => c.id)
        ];

        const newDefects = CardsManager.getRandomDefects(1, allUsedDefectIds);
        if (newDefects.length > 0) {
            newDefects[0].isActive = true;
            this.state.activeDefects.push(newDefects[0]);
            this.state.usedDefectIds.push(newDefects[0].id);
            this.addLog(`⚡ J03: Новый дефект "${newDefects[0].header}"!`, 'danger');
        }
        this.updateUI();
    },

    /**
     * Удалить случайную фичу (эффект D16 "Отключение защитного экрана")
     * Если фича сломана, удаляется и связанный сбой
     */
    removeRandomFeature() {
        if (this.state.activeFeatures.length === 0) {
            this.addLog(`⚡ Защитный экран отключён, но фич нет`, 'warning');
            return;
        }

        // Выбираем случайную фичу
        const randomIndex = Math.floor(Math.random() * this.state.activeFeatures.length);
        const feature = this.state.activeFeatures[randomIndex];

        // Если фича сломана, удаляем связанный сбой
        if (feature.isBroken) {
            const crashId = 'C' + feature.id.substring(1); // F01 -> C01
            this.state.activeCrashes = this.state.activeCrashes.filter(c => c.id !== crashId);
            this.addLog(`💥 Сбой "${feature.header}" уничтожен вместе с фичей`, 'danger');
        }

        // Удаляем фичу
        this.state.activeFeatures.splice(randomIndex, 1);
        this.addLog(`☠️ Фича "${feature.header}" уничтожена защитным экраном!`, 'danger');

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
            title = '🏆 Легендарная победа!';
            message = 'Ваша миссия войдёт в историю космических исследований! Корабль вернулся в идеальном состоянии, а команда показала невероятное мастерство управления системами. Центр управления уже планирует вашу следующую экспедицию!';
        } else if (score >= 120) {
            title = '✨ Отличный результат!';
            message = 'Команда продемонстрировала высокий профессионализм. Все системы работают стабильно, миссия завершена с превосходными показателями. Вы заслужили отдых перед следующим полётом!';
        } else if (score >= 80) {
            title = '🚀 Миссия выполнена';
            message = 'Несмотря на некоторые трудности, команда справилась с задачей. Корабль доставлен в целости, хотя некоторые системы требуют ремонта. Хорошая работа!';
        } else if (score >= 50) {
            title = '😓 Едва справились';
            message = 'Это было непросто. Множество поломок и критических ситуаций едва не сорвали миссию. Команде повезло вернуться живыми. Требуется серьёзный ремонт корабля.';
        } else if (score >= 20) {
            title = '⚠️ Катастрофа предотвращена';
            message = 'Корабль еле держится, системы в критическом состоянии. Вам удалось избежать полного уничтожения, но миссию сложно назвать успешной. Экипаж нуждается в отдыхе и психологической помощи.';
        } else if (score > 0) {
            title = '💀 На грани провала';
            message = 'Миссия провалена. Корабль практически разрушен, команда получила серьёзные травмы. Лишь чудом удалось избежать полной катастрофы. Центр управления начинает расследование.';
        } else {
            title = '☠️ Полная катастрофа';
            message = 'Корабль потерян. Системы вышли из строя, экипаж не смог справиться с накопившимися проблемами. Это был печальный конец экспедиции. Память о храбрых космонавтах будет жить вечно.';
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
