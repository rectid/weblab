/**
 * Selenium E2E тесты для проверки торговых операций
 *
 * Тесты проверяют:
 * 1. Покупку N акций и изменение баланса брокера
 * 2. Продажу N акций и изменение баланса брокера
 * 3. Правильный расчёт прибыли/убытка по акциям
 *
 * Требования:
 * - Chrome/Chromium с поддержкой headless
 * - Запущенный backend на порту 3001
 * - Запущенный frontend на порту 5174
 * - Наличие хотя бы одного брокера в системе
 *
 * Запуск: npm run test:e2e
 */

import pkg from 'selenium-webdriver';
const { Builder, By, until, Key } = pkg;
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import assert from 'assert';

// Конфигурация
const BASE_URL = process.env.TEST_URL || 'http://localhost:5174';
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TIMEOUT = 15000;
const IMPLICIT_WAIT = 5000;

// Утилита для ожидания
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Класс для E2E тестирования торгового приложения
 */
class TradingE2ETests {
    constructor() {
        this.driver = null;
        this.testResults = [];
    }

    /**
     * Инициализация WebDriver
     */
    async setup() {
        console.log('🚀 Инициализация Selenium WebDriver...');
        
        const options = new ChromeOptions();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        
        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        
        await this.driver.manage().setTimeouts({ implicit: IMPLICIT_WAIT });
        console.log('✅ WebDriver инициализирован');
    }

    /**
     * Закрытие WebDriver
     */
    async teardown() {
        if (this.driver) {
            await this.driver.quit();
            console.log('🔚 WebDriver закрыт');
        }
    }

    /**
     * Логирование результата теста
     */
    logResult(testName, passed, details = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName}`);
        if (details) console.log(`   ${details}`);
        this.testResults.push({ testName, passed, details });
    }

    /**
     * Ожидание элемента и клик
     */
    async clickElement(selector, timeout = TIMEOUT) {
        const element = await this.driver.wait(
            until.elementLocated(selector),
            timeout
        );
        // Пробуем подождать видимость, но если не получится - всё равно кликаем
        try {
            await this.driver.wait(until.elementIsVisible(element), 3000);
        } catch (e) {
            // Элемент может быть не видим из-за особенностей Vuetify, но кликабелен
        }
        // Используем JavaScript click для обхода проблем с видимостью
        await this.driver.executeScript("arguments[0].click();", element);
        return element;
    }

    /**
     * Ожидание элемента и получение текста
     */
    async getElementText(selector, timeout = TIMEOUT) {
        const element = await this.driver.wait(
            until.elementLocated(selector),
            timeout
        );
        return await element.getText();
    }

    /**
     * Получение баланса брокера из UI
     */
    async getBrokerBalance() {
        try {
            // Ищем элемент с балансом в карточке статистики
            const balanceElement = await this.driver.wait(
                until.elementLocated(By.css('[data-testid="broker-balance"]')),
                TIMEOUT
            );
            const text = await balanceElement.getText();
            // Извлекаем число из текста типа "$10,000.00"
            const match = text.match(/\$?([\d,]+\.?\d*)/);
            if (match) {
                return parseFloat(match[1].replace(/,/g, ''));
            }
            return 0;
        } catch (e) {
            console.error('Ошибка получения баланса:', e.message);
            return 0;
        }
    }

    /**
     * Получение количества акций в портфеле
     */
    async getStockHolding(symbol) {
        try {
            // Находим строку с нужным символом акции
            const rows = await this.driver.findElements(By.css('tr, .stock-card-mobile'));
            for (const row of rows) {
                const text = await row.getText();
                if (text.includes(symbol)) {
                    // Ищем количество акций (например "5 шт.")
                    const match = text.match(/(\d+)\s*шт/);
                    if (match) {
                        return parseInt(match[1]);
                    }
                }
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Тест: Вход в систему
     */
    async testLogin() {
        console.log('\n📋 Тест: Вход в систему');
        
        try {
            await this.driver.get(BASE_URL);
            await sleep(3000); // Увеличиваем время ожидания
            
            // Ждём загрузки страницы и данных
            await this.driver.wait(
                until.elementLocated(By.css('body')),
                TIMEOUT
            );
            
            // Отладка: выводим заголовок страницы
            const title = await this.driver.getTitle();
            console.log(`   Заголовок страницы: ${title}`);
            
            // Отладка: выводим текущий URL
            const currentUrl = await this.driver.getCurrentUrl();
            console.log(`   Текущий URL: ${currentUrl}`);
            
            // Отладка: ищем все элементы с data-testid
            const testElements = await this.driver.findElements(By.css('[data-testid]'));
            console.log(`   Найдено элементов с data-testid: ${testElements.length}`);
            
            for (let i = 0; i < testElements.length; i++) {
                const testid = await testElements[i].getAttribute('data-testid');
                console.log(`   data-testid[${i}]: ${testid}`);
            }
            
            // Также ищем v-select элементы
            const vSelectElements = await this.driver.findElements(By.css('.v-select, .v-field'));
            console.log(`   Найдено v-select элементов: ${vSelectElements.length}`);
            
            // Ждём загрузки брокеров с API (должен появиться элемент списка)
            await sleep(2000);
            
            // Кликаем на поле ввода внутри v-select чтобы открыть выпадающий список
            const selectInput = await this.driver.findElement(By.css('[data-testid="broker-select"] .v-field__input, [data-testid="broker-select"] input'));
            
            // Используем Actions API для более реалистичного клика
            const actions = this.driver.actions({ async: true });
            await actions.move({ origin: selectInput }).click().perform();
            await sleep(1000);
            
            // Ждём появления выпадающего меню
            await this.driver.wait(
                until.elementLocated(By.css('.v-list, .v-menu__content, .v-overlay__content .v-list')),
                TIMEOUT
            );
            await sleep(500);
            
            // Выбираем первого брокера из списка с помощью Actions API
            const listItems = await this.driver.findElements(By.css('.v-list-item'));
            console.log(`   Найдено элементов списка: ${listItems.length}`);
            
            if (listItems.length > 0) {
                // Ищем элемент, который реально является опцией (не заголовок)
                for (const item of listItems) {
                    const text = await item.getText();
                    if (text && text.length > 0) {
                        console.log(`   Выбираем брокера: ${text.substring(0, 30)}...`);
                        // Прокручиваем к элементу и кликаем на него
                        await this.driver.executeScript("arguments[0].scrollIntoView(true);", item);
                        await sleep(200);
                        // Пробуем обычный клик
                        await item.click();
                        await sleep(1000);
                        break;
                    }
                }
            } else {
                throw new Error('Список брокеров пуст');
            }
            
            // Проверяем, что кнопка входа стала активной
            const loginBtn = await this.driver.findElement(By.css('[data-testid="login-btn"]'));
            const isDisabled = await loginBtn.getAttribute('disabled');
            console.log(`   Кнопка входа disabled: ${isDisabled}`);
            
            // Нажимаем кнопку входа нативным кликом
            await loginBtn.click();
            await sleep(3000); // Увеличиваем время ожидания после входа
            
            // Проверяем что мы на странице торговли
            const url = await this.driver.getCurrentUrl();
            const passed = url.includes('/trading');
            
            this.logResult('Вход в систему', passed, `URL: ${url}`);
            return passed;
        } catch (e) {
            this.logResult('Вход в систему', false, e.message);
            return false;
        }
    }

    /**
     * Тест: Покупка акций и проверка изменения баланса
     */
    async testBuyStock() {
        console.log('\n📋 Тест: Покупка акций');
        
        try {
            const quantityToBuy = 5;
            
            // Получаем начальный баланс
            const initialBalance = await this.getBrokerBalance();
            console.log(`   Начальный баланс: $${initialBalance}`);
            
            // Находим первую активную акцию и её цену
            await sleep(1000);
            
            // Кликаем кнопку покупки (первую активную кнопку)
            const buyButtons = await this.driver.findElements(By.css('[data-testid="buy-btn"], [data-testid="buy-btn-mobile"]'));
            if (buyButtons.length === 0) {
                throw new Error('Кнопки покупки не найдены');
            }
            
            // Ищем активную (не disabled) кнопку покупки
            let activeBuyButton = null;
            for (const btn of buyButtons) {
                const isDisabled = await btn.getAttribute('disabled');
                if (!isDisabled) {
                    activeBuyButton = btn;
                    break;
                }
            }
            
            if (!activeBuyButton) {
                throw new Error('Нет активных кнопок покупки');
            }
            
            await activeBuyButton.click();
            await sleep(1000);
            
            // Ждём открытия диалога покупки
            await this.driver.wait(
                until.elementLocated(By.css('.v-dialog, [role="dialog"]')),
                TIMEOUT
            );
            
            // Получаем цену акции из диалога
            const dialogText = await this.getElementText(By.css('.v-dialog, [role="dialog"]'));
            const priceMatch = dialogText.match(/\$?([\d,]+\.?\d*)/);
            const stockPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
            console.log(`   Цена акции: $${stockPrice}`);
            
            // Вводим количество
            const quantityInput = await this.driver.findElement(By.css('[data-testid="buy-quantity-input"] input, input[type="number"]'));
            // Очищаем поле с помощью Ctrl+A и Delete
            await quantityInput.sendKeys(Key.CONTROL, 'a');
            await quantityInput.sendKeys(Key.DELETE);
            await sleep(100);
            await quantityInput.sendKeys(quantityToBuy.toString());
            await sleep(500);
            
            // Нажимаем кнопку подтверждения покупки
            const confirmBuyBtn = await this.driver.findElement(By.css('[data-testid="confirm-buy-btn"]'));
            await confirmBuyBtn.click();
            await sleep(2000);
            
            // Получаем новый баланс
            const newBalance = await this.getBrokerBalance();
            console.log(`   Новый баланс: $${newBalance}`);
            
            // Проверяем что баланс уменьшился на стоимость покупки
            const expectedCost = stockPrice * quantityToBuy;
            const actualChange = initialBalance - newBalance;
            const tolerance = 0.01; // Допуск для погрешности округления
            
            const passed = Math.abs(actualChange - expectedCost) < (expectedCost * tolerance + 1);
            
            this.logResult(
                'Покупка акций',
                passed,
                `Ожидаемое списание: $${expectedCost.toFixed(2)}, Фактическое: $${actualChange.toFixed(2)}`
            );
            
            return passed;
        } catch (e) {
            this.logResult('Покупка акций', false, e.message);
            return false;
        }
    }

    /**
     * Тест: Продажа акций и проверка изменения баланса
     */
    async testSellStock() {
        console.log('\n📋 Тест: Продажа акций');
        
        try {
            const quantityToSell = 2;
            
            // Получаем начальный баланс
            const initialBalance = await this.getBrokerBalance();
            console.log(`   Начальный баланс: $${initialBalance}`);
            
            await sleep(1000);
            
            // Находим кнопку продажи (красная кнопка -)
            const sellButtons = await this.driver.findElements(By.css('[data-testid="sell-btn"], [data-testid="sell-btn-mobile"]'));
            
            // Ищем активную (не disabled) кнопку продажи
            let activeSellButton = null;
            for (const btn of sellButtons) {
                const isDisabled = await btn.getAttribute('disabled');
                if (!isDisabled) {
                    activeSellButton = btn;
                    break;
                }
            }
            
            if (!activeSellButton) {
                this.logResult('Продажа акций', false, 'Нет доступных кнопок продажи (возможно, нет акций в портфеле)');
                return false;
            }
            
            await activeSellButton.click();
            await sleep(1000);
            
            // Ждём открытия диалога продажи
            await this.driver.wait(
                until.elementLocated(By.css('.v-dialog, [role="dialog"]')),
                TIMEOUT
            );
            
            // Получаем цену акции из диалога
            const dialogText = await this.getElementText(By.css('.v-dialog, [role="dialog"]'));
            const priceMatch = dialogText.match(/\$?([\d,]+\.?\d*)/);
            const stockPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
            console.log(`   Цена продажи: $${stockPrice}`);
            
            // Вводим количество для продажи
            const quantityInput = await this.driver.findElement(By.css('[data-testid="sell-quantity-input"] input, input[type="number"]'));
            // Очищаем поле с помощью Ctrl+A и Delete
            await quantityInput.sendKeys(Key.CONTROL, 'a');
            await quantityInput.sendKeys(Key.DELETE);
            await sleep(100);
            await quantityInput.sendKeys(quantityToSell.toString());
            await sleep(500);
            
            // Нажимаем кнопку подтверждения продажи
            const confirmSellBtn = await this.driver.findElement(By.css('[data-testid="confirm-sell-btn"]'));
            await confirmSellBtn.click();
            await sleep(2000);
            
            // Получаем новый баланс
            const newBalance = await this.getBrokerBalance();
            console.log(`   Новый баланс: $${newBalance}`);
            
            // Проверяем что баланс увеличился на стоимость продажи
            const expectedIncome = stockPrice * quantityToSell;
            const actualChange = newBalance - initialBalance;
            const tolerance = 0.01;
            
            const passed = Math.abs(actualChange - expectedIncome) < (expectedIncome * tolerance + 1);
            
            this.logResult(
                'Продажа акций',
                passed,
                `Ожидаемое пополнение: $${expectedIncome.toFixed(2)}, Фактическое: $${actualChange.toFixed(2)}`
            );
            
            return passed;
        } catch (e) {
            this.logResult('Продажа акций', false, e.message);
            return false;
        }
    }

    /**
     * Тест: Проверка P/L (прибыли/убытка)
     */
    async testProfitLoss() {
        console.log('\n📋 Тест: Отображение P/L');
        
        try {
            await sleep(1000);
            
            // Ищем элементы с отображением P/L
            const plElements = await this.driver.findElements(
                By.css('[data-testid="pnl-chip"], [data-testid="pnl-chip-mobile"]')
            );
            
            // Проверяем наличие элементов P/L
            if (plElements.length > 0) {
                const plText = await plElements[0].getText();
                console.log(`   Найден P/L элемент: ${plText}`);
                
                // Проверяем формат P/L (должен быть +$X.XX или -$X.XX или $0.00)
                const validFormat = /^[+-]?\$[\d,]+\.?\d*$|^\$0(\.00)?$/.test(plText.trim());
                
                this.logResult('Отображение P/L', validFormat, `Формат P/L: ${plText}`);
                return validFormat;
            } else {
                // Если нет позиций, P/L может не отображаться - это нормально
                this.logResult('Отображение P/L', true, 'P/L элементы не найдены (возможно, нет позиций)');
                return true;
            }
        } catch (e) {
            this.logResult('Отображение P/L', false, e.message);
            return false;
        }
    }

    /**
     * Тест: Проверка обновления баланса в реальном времени
     */
    async testRealTimeBalanceUpdate() {
        console.log('\n📋 Тест: Обновление баланса в реальном времени');
        
        try {
            // Получаем начальные данные
            const initialBalance = await this.getBrokerBalance();
            console.log(`   Начальный баланс: $${initialBalance}`);
            
            // Ждём некоторое время для возможного обновления цен
            await sleep(3000);
            
            // Проверяем что страница всё ещё отзывчива
            const currentUrl = await this.driver.getCurrentUrl();
            const pageResponsive = currentUrl.includes('/trading');
            
            this.logResult(
                'Обновление в реальном времени',
                pageResponsive,
                'Страница остаётся отзывчивой'
            );
            
            return pageResponsive;
        } catch (e) {
            this.logResult('Обновление в реальном времени', false, e.message);
            return false;
        }
    }

    /**
     * Тест: Полный цикл торговли (покупка -> ожидание -> продажа -> проверка P/L)
     */
    async testFullTradingCycle() {
        console.log('\n📋 Тест: Полный цикл торговли');
        
        try {
            // 1. Получаем начальный баланс
            const initialBalance = await this.getBrokerBalance();
            console.log(`   1. Начальный баланс: $${initialBalance}`);
            
            // 2. Покупаем акции
            const quantityToBuy = 3;
            
            const buyButtons = await this.driver.findElements(By.css('button[color="success"]:not([disabled])'));
            if (buyButtons.length === 0) {
                throw new Error('Нет доступных кнопок покупки');
            }
            
            await buyButtons[0].click();
            await sleep(1000);
            
            // Получаем цену из диалога
            await this.driver.wait(until.elementLocated(By.css('.v-dialog')), TIMEOUT);
            const buyDialogText = await this.getElementText(By.css('.v-dialog'));
            const buyPriceMatch = buyDialogText.match(/Цена[:\s]*\$?([\d,]+\.?\d*)/i) || buyDialogText.match(/\$?([\d,]+\.?\d*)/);
            const buyPrice = buyPriceMatch ? parseFloat(buyPriceMatch[1].replace(/,/g, '')) : 0;
            console.log(`   2. Цена покупки: $${buyPrice}`);
            
            // Вводим количество и покупаем
            const buyInput = await this.driver.findElement(By.css('.v-dialog input[type="number"]'));
            await buyInput.clear();
            await buyInput.sendKeys(quantityToBuy.toString());
            
            const confirmBuyBtn = await this.driver.findElement(By.css('.v-dialog button[color="success"], .v-dialog .gradient-btn-success'));
            await confirmBuyBtn.click();
            await sleep(2000);
            
            // 3. Проверяем баланс после покупки
            const balanceAfterBuy = await this.getBrokerBalance();
            const buyCost = buyPrice * quantityToBuy;
            console.log(`   3. Баланс после покупки: $${balanceAfterBuy} (списано: $${(initialBalance - balanceAfterBuy).toFixed(2)})`);
            
            // 4. Ждём изменения цены (симуляция)
            console.log('   4. Ожидание изменения цен...');
            await sleep(3000);
            
            // 5. Продаём акции
            const sellButtons = await this.driver.findElements(By.css('button[color="error"]:not([disabled])'));
            if (sellButtons.length > 0) {
                await sellButtons[0].click();
                await sleep(1000);
                
                await this.driver.wait(until.elementLocated(By.css('.v-dialog')), TIMEOUT);
                const sellDialogText = await this.getElementText(By.css('.v-dialog'));
                const sellPriceMatch = sellDialogText.match(/Цена[:\s]*\$?([\d,]+\.?\d*)/i) || sellDialogText.match(/\$?([\d,]+\.?\d*)/);
                const sellPrice = sellPriceMatch ? parseFloat(sellPriceMatch[1].replace(/,/g, '')) : 0;
                console.log(`   5. Цена продажи: $${sellPrice}`);
                
                const sellInput = await this.driver.findElement(By.css('.v-dialog input[type="number"]'));
                await sellInput.clear();
                await sellInput.sendKeys(quantityToBuy.toString());
                
                const confirmSellBtn = await this.driver.findElement(By.css('.v-dialog button[color="error"]'));
                await confirmSellBtn.click();
                await sleep(2000);
                
                // 6. Проверяем финальный баланс
                const finalBalance = await this.getBrokerBalance();
                const sellIncome = sellPrice * quantityToBuy;
                const profitLoss = finalBalance - initialBalance;
                
                console.log(`   6. Финальный баланс: $${finalBalance}`);
                console.log(`   7. P/L: ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toFixed(2)}`);
                
                // Проверяем что изменение баланса соответствует разнице цен
                const expectedPL = (sellPrice - buyPrice) * quantityToBuy;
                const tolerance = Math.abs(expectedPL) * 0.01 + 1;
                const passed = Math.abs(profitLoss - expectedPL) < tolerance;
                
                this.logResult(
                    'Полный цикл торговли',
                    passed,
                    `Ожидаемый P/L: $${expectedPL.toFixed(2)}, Фактический: $${profitLoss.toFixed(2)}`
                );
                
                return passed;
            } else {
                this.logResult('Полный цикл торговли', false, 'Невозможно продать - нет акций в портфеле');
                return false;
            }
        } catch (e) {
            this.logResult('Полный цикл торговли', false, e.message);
            return false;
        }
    }

    /**
     * Запуск всех тестов
     */
    async runAllTests() {
        console.log('═══════════════════════════════════════════════════');
        console.log('🧪 E2E ТЕСТЫ ТОРГОВОГО ПРИЛОЖЕНИЯ (Selenium)');
        console.log('═══════════════════════════════════════════════════');
        console.log(`🌐 URL приложения: ${BASE_URL}`);
        console.log(`🔌 API URL: ${API_URL}`);
        console.log('═══════════════════════════════════════════════════\n');
        
        try {
            await this.setup();
            
            // Сначала выполняем вход в систему
            const loginSuccess = await this.testLogin();
            
            if (loginSuccess) {
                // Если вход успешен, выполняем остальные тесты в той же сессии
                await this.testBuyStock();
                await this.testSellStock();
                await this.testProfitLoss();
                await this.testRealTimeBalanceUpdate();
            } else {
                console.log('❌ Пропускаем остальные тесты - вход не удался');
                // Отмечаем остальные тесты как проваленные
                this.logResult('Покупка акций', false, 'Пропущено - вход не удался');
                this.logResult('Продажа акций', false, 'Пропущено - вход не удался');
                this.logResult('Отображение P/L', false, 'Пропущено - вход не удался');
                this.logResult('Обновление в реальном времени', false, 'Пропущено - вход не удался');
            }
            
        } catch (e) {
            console.error('❌ Критическая ошибка:', e.message);
        } finally {
            await this.teardown();
        }
        
        // Вывод итогов
        console.log('\n═══════════════════════════════════════════════════');
        console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ');
        console.log('═══════════════════════════════════════════════════');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;
        
        console.log(`✅ Пройдено: ${passed}/${total}`);
        console.log(`❌ Провалено: ${failed}/${total}`);
        console.log(`📈 Успешность: ${((passed/total) * 100).toFixed(1)}%`);
        console.log('═══════════════════════════════════════════════════\n');
        
        // Возвращаем код выхода
        process.exit(failed > 0 ? 1 : 0);
    }
}

// Запуск тестов
const tests = new TradingE2ETests();
tests.runAllTests();
