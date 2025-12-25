/**
 * Модуль для работы с карточками
 * Формат данных и шаблонов из Mars2
 */

const CardsManager = {
    cards: [],           // Все карты
    defects: [],         // D01-D20
    features: [],        // F01-F20
    crashes: [],         // C01-C20
    jokers: [],          // J01-J05
    templates: {},       // SVG шаблоны по именам
    backgroundImage: null, // Base64 фоновое изображение

    /**
     * Инициализация - загрузка всех данных
     */
    async init() {
        try {
            // Загружаем CSV данные
            const csvData = await this.loadCSV('data/cards_data.csv');
            this.cards = this.parseCardsCSV(csvData);

            // Разделяем по типам
            this.defects = this.cards.filter(c => c.id.startsWith('D'));
            this.features = this.cards.filter(c => c.id.startsWith('F'));
            this.crashes = this.cards.filter(c => c.id.startsWith('C'));
            this.jokers = this.cards.filter(c => c.id.startsWith('J'));

            // Загружаем уникальные шаблоны
            const templateNames = [...new Set(this.cards.map(c => c.template))];
            await this.loadTemplates(templateNames);

            // Загружаем фоновое изображение
            await this.loadBackgroundImage('images/fon.jpg');

            console.log(`Загружено: ${this.defects.length} дефектов, ${this.features.length} фич, ${this.crashes.length} сбоев, ${this.jokers.length} джокеров`);
            return true;
        } catch (error) {
            console.error('Ошибка загрузки карточек:', error);
            return false;
        }
    },

    /**
     * Загрузка CSV файла
     */
    async loadCSV(url) {
        const response = await fetch(url);
        return await response.text();
    },

    /**
     * Загрузка SVG шаблонов
     */
    async loadTemplates(templateNames) {
        const promises = templateNames.map(async (name) => {
            try {
                const response = await fetch(`templates/${name}`);
                if (response.ok) {
                    this.templates[name] = await response.text();
                }
            } catch (e) {
                console.warn(`Шаблон ${name} не найден`);
            }
        });
        await Promise.all(promises);
    },

    /**
     * Загрузка фонового изображения и конвертация в base64
     */
    async loadBackgroundImage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn('Фоновое изображение не найдено');
                return;
            }
            const blob = await response.blob();

            // Конвертируем в base64
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    this.backgroundImage = reader.result;
                    console.log('Фоновое изображение загружено');
                    resolve();
                };
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn('Ошибка загрузки фонового изображения:', e);
        }
    },

    /**
     * Добавление фонового изображения в SVG
     */
    addBackgroundToSvg(svg) {
        if (!this.backgroundImage) return svg;

        // Создаем элемент изображения для фона
        // Размер карточки: 180x265
        const backgroundImage = `<image href="${this.backgroundImage}" x="0" y="0" width="180" height="265" preserveAspectRatio="xMidYMid slice" opacity="1.0"/>`;

        // Вставляем изображение после </defs>
        const defsEnd = svg.indexOf('</defs>');
        if (defsEnd !== -1) {
            const insertPos = defsEnd + 7; // длина '</defs>'
            svg = svg.slice(0, insertPos) + '\n  ' + backgroundImage + '\n  ' + svg.slice(insertPos);
        } else {
            // Если нет <defs>, вставляем после открывающего тега <svg>
            const svgTagEnd = svg.indexOf('>', svg.indexOf('<svg'));
            if (svgTagEnd !== -1) {
                const insertPos = svgTagEnd + 1;
                svg = svg.slice(0, insertPos) + '\n  ' + backgroundImage + '\n  ' + svg.slice(insertPos);
            }
        }

        return svg;
    },

    /**
     * Парсинг CSV карточек
     */
    parseCardsCSV(csv) {
        const lines = csv.trim().split('\n');
        const headers = this.parseCSVLine(lines[0]);

        return lines.slice(1).map(line => {
            const values = this.parseCSVLine(line);
            return {
                id: values[0],
                template: values[1],
                header: values[2],
                text: values[3],
                cost: values[4],
                loss: values[5],
                diceLoss: values[6],
                profit: values[7],
                diceProfit: values[8],
                jokerPositive: values[9],
                jokerNegative: values[10],
                // Игровое состояние
                isActive: false,
                isBroken: false
            };
        });
    },

    /**
     * Парсинг строки CSV
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    },

    /**
     * Разбивка текста на строки (макс 22 символа для SVG шаблона)
     */
    splitText(text, maxChars = 22) {
        if (!text) return ['', '', '', '', '', ''];

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            // Если слово длиннее maxChars, разбиваем его
            if (word.length > maxChars) {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = '';
                }
                // Разбиваем длинное слово
                for (let i = 0; i < word.length; i += maxChars) {
                    lines.push(word.substring(i, i + maxChars));
                }
            } else if ((currentLine + ' ' + word).trim().length <= maxChars) {
                currentLine = (currentLine + ' ' + word).trim();
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine) lines.push(currentLine);

        // Дополняем до 6 строк
        while (lines.length < 6) lines.push('');
        return lines.slice(0, 6);
    },

    /**
     * Разбивка заголовка на 2 строки
     */
    splitHeader(header) {
        if (!header) return ['', ''];

        const words = header.split(' ');
        if (words.length === 1) return [header, ''];

        const mid = Math.ceil(words.length / 2);
        return [
            words.slice(0, mid).join(' '),
            words.slice(mid).join(' ')
        ];
    },

    /**
     * Создание SVG карточки
     */
    createCard(card) {
        let svg = this.templates[card.template];
        if (!svg) {
            console.warn(`Шаблон ${card.template} не найден`);
            return '<svg></svg>';
        }

        // Заголовок
        const [header1, header2] = this.splitHeader(card.header);
        svg = svg.replace(/%header_1%/g, this.escapeXml(header1));
        svg = svg.replace(/%header_2%/g, this.escapeXml(header2));
        svg = svg.replace(/%header%/g, this.escapeXml(card.header));

        // Описание (6 строк)
        const textLines = this.splitText(card.text);
        for (let i = 0; i < 6; i++) {
            svg = svg.replace(new RegExp(`%text_0${i + 1}%`, 'g'), this.escapeXml(textLines[i]));
        }

        // Стоимость и эффекты
        svg = svg.replace(/%COST%/g, this.escapeXml(card.cost || ''));
        svg = svg.replace(/%LOSS%/g, this.escapeXml(card.loss || ''));
        svg = svg.replace(/%DIECE_LOSS%/g, this.escapeXml(card.diceLoss || ''));
        svg = svg.replace(/%PROFIT%/g, this.escapeXml(card.profit || ''));
        svg = svg.replace(/%DIECE_PROFIT%/g, this.escapeXml(card.diceProfit || ''));
        svg = svg.replace(/%DIECE_ PROFIT%/g, this.escapeXml(card.diceProfit || ''));

        // Джокер тексты
        if (card.id.startsWith('J')) {
            const posLines = this.splitText(card.jokerPositive, 30);
            const negLines = this.splitText(card.jokerNegative, 30);
            for (let i = 0; i < 3; i++) {
                svg = svg.replace(new RegExp(`%Joker_text_positive_0${i + 1}%`, 'g'), this.escapeXml(posLines[i] || ''));
                svg = svg.replace(new RegExp(`%Joker_text_negative_0${i + 1}%`, 'g'), this.escapeXml(negLines[i] || ''));
            }
        }

        // Добавляем фоновое изображение
        svg = this.addBackgroundToSvg(svg);

        return svg;
    },

    /**
     * Определение уровня критичности по шаблону
     */
    getLevelFromTemplate(template) {
        if (!template) return 'normal';

        // Дефекты и сбои
        if (template.includes('EASY') || template.includes('STABLE')) return 'easy';
        if (template.includes('MEDIUM') || template.includes('NORMAL')) return 'medium';
        if (template.includes('HARD') || template.includes('UNSTABLE')) return 'hard';
        if (template.includes('EXTREME') || template.includes('RISKY')) return 'extreme';
        if (template.includes('SPECIAL')) return 'special';
        if (template.includes('JOKER')) return 'joker';

        return 'normal';
    },

    /**
     * Создание мини-карточки для игрового интерфейса
     */
    createMiniCard(card, type) {
        const div = document.createElement('div');
        const level = this.getLevelFromTemplate(card.template);
        div.className = `mini-card ${type} level-${level}`;
        div.dataset.id = card.id;
        div.dataset.type = type;

        if (card.isBroken) {
            div.classList.add('broken');
        }

        // Определяем тип карты по ID
        const cardType = card.id.charAt(0);
        let typeLabel = '';
        let costLabel = '';
        let triggerPositive = '';  // Положительное событие (прибыль)
        let triggerNegative = '';  // Отрицательное событие (потеря/поломка)

        switch (cardType) {
            case 'D': // Дефект
                typeLabel = 'ДЕФЕКТ';
                triggerNegative = card.diceLoss ? `💥 ${card.diceLoss}` : '';
                costLabel = card.cost || '';
                break;
            case 'F': // Фича/Улучшение
                typeLabel = card.isBroken ? '⚠️ СБОЙ' : 'ФИЧА';
                if (card.isBroken) {
                    triggerNegative = card.diceLoss ? `💥 ${card.diceLoss}` : '';
                    costLabel = card.cost || '';
                } else {
                    // Показываем оба значения для фичи
                    triggerPositive = card.diceProfit ? `💰 ${card.diceProfit}` : '';
                    triggerNegative = card.diceLoss ? `💥 ${card.diceLoss}` : '';
                    costLabel = card.profit ? `${card.profit}` : card.cost;
                }
                break;
            case 'C': // Сбой
                typeLabel = 'СБОЙ';
                triggerNegative = card.diceLoss ? `💥 ${card.diceLoss}` : '';
                costLabel = card.cost || '';
                break;
            case 'J': // Джокер
                typeLabel = 'ДЖОКЕР';
                costLabel = card.cost || '';
                break;
        }

        // Формируем блок триггеров
        let triggersHtml = '';
        if (triggerPositive || triggerNegative) {
            triggersHtml = '<div class="mini-card-triggers">';
            if (triggerPositive) {
                triggersHtml += `<div class="mini-card-trigger positive">${triggerPositive}</div>`;
            }
            if (triggerNegative) {
                triggersHtml += `<div class="mini-card-trigger negative">${triggerNegative}</div>`;
            }
            triggersHtml += '</div>';
        }

        div.innerHTML = `
            <div class="mini-card-type">${typeLabel}</div>
            <div class="mini-card-id">${card.id}</div>
            <div class="mini-card-name">${card.header}</div>
            ${triggersHtml}
            <div class="mini-card-cost">${costLabel}</div>
        `;

        return div;
    },

    /**
     * Экранирование XML символов
     */
    escapeXml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    /**
     * Парсинг числа из строки стоимости/потери
     */
    parseNumber(str) {
        if (!str) return 0;
        const match = str.match(/[−\-+]?(\d+)/);
        return match ? parseInt(match[1]) : 0;
    },

    /**
     * Проверка диапазона кубиков
     */
    checkDiceRange(diceStr, diceSum) {
        if (!diceStr) return false;

        // Специальные значения
        if (diceStr === 'всегда') return true;
        if (diceStr === 'нечет.' || diceStr === 'нечет') return diceSum % 2 === 1;
        if (diceStr === 'четные' || diceStr === 'чет.') return diceSum % 2 === 0;
        if (diceStr === 'дубль') return false; // Обрабатывается отдельно

        // Парсим диапазоны и отдельные числа
        const parts = diceStr.split(',').map(p => p.trim());

        for (const part of parts) {
            if (part.includes('-') || part.includes('–')) {
                const [min, max] = part.split(/[-–]/).map(n => parseInt(n.trim()));
                if (diceSum >= min && diceSum <= max) return true;
            } else {
                if (parseInt(part) === diceSum) return true;
            }
        }

        return false;
    },

    /**
     * Получить случайные карты
     */
    getRandomCards(arr, count, excludeIds = []) {
        const available = arr.filter(c => !excludeIds.includes(c.id));
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(c => ({ ...c }));
    },

    /**
     * Получить случайные дефекты
     */
    getRandomDefects(count, excludeIds = []) {
        return this.getRandomCards(this.defects, count, excludeIds);
    },

    /**
     * Получить случайные фичи
     */
    getRandomFeatures(count, excludeIds = []) {
        return this.getRandomCards(this.features, count, excludeIds);
    },

    /**
     * Получить сбой для фичи
     */
    getCrashForFeature(featureId) {
        // F01 -> C01
        const crashId = 'C' + featureId.substring(1);
        const crash = this.crashes.find(c => c.id === crashId);
        return crash ? { ...crash } : null;
    },

    /**
     * Получить случайного джокера
     */
    getRandomJoker(excludeIds = []) {
        const available = this.jokers.filter(j => !excludeIds.includes(j.id));
        if (available.length === 0) return null;
        const idx = Math.floor(Math.random() * available.length);
        return { ...available[idx] };
    },

    /**
     * Получить карту по ID
     */
    getCard(id) {
        return this.cards.find(c => c.id === id);
    }
};

// Экспорт
window.CardsManager = CardsManager;
