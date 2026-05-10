# 🔒 Защита от кражи кода

## Реализованная защита

### 1. **AntiDevTools.js** - Комплексная защита от DevTools

Файл: `fear-protection-v2/js/AntiDevTools.js`

#### Функции защиты:

✅ **Блокировка горячих клавиш:**
- F12 - открытие DevTools
- Ctrl+Shift+I - DevTools
- Ctrl+Shift+J - Console
- Ctrl+Shift+C - Inspect Element
- Ctrl+U - View Source
- Ctrl+S - Save Page
- Ctrl+A - Select All (опционально)
- Ctrl+C - Copy (опционально)

✅ **Блокировка контекстного меню:**
- Правый клик мыши полностью отключен

✅ **Блокировка выделения и копирования:**
- Невозможно выделить текст на странице
- Копирование через Ctrl+C заблокировано
- Событие `copy` перехвачено

✅ **Детектирование открытия DevTools:**
- По изменению размера окна (разница между outer и inner)
- Через debugger statement
- Через console.log с Object.defineProperty

✅ **Защита от iframe:**
- Автоматический редирект если страница в iframe

✅ **Очистка console методов:**
- Все методы console заменены на пустые функции
- Предотвращает логирование и отладку

✅ **Предупреждение в консоли:**
- Красное предупреждение о мошенничестве
- Информация о рисках для пользователей

#### Поведение при обнаружении DevTools:

1. Страница заменяется на экран "Доступ запрещён"
2. Через 3 секунды автоматическая перезагрузка
3. Все скрипты очищаются

## Подключение защиты

Защита подключена на **всех страницах** fear-protection-v2:

```html
<script src="js/AntiDevTools.js?v=1"></script>
```

### Список защищённых страниц:

✅ admin-panel.html
✅ admins-list.html  
✅ anticheat.html
✅ ban-goals.html
✅ check.html
✅ discord-search.html
✅ login.html
✅ my-tickets.html
✅ profile.html
✅ quotas.html
✅ rules.html
✅ ticket-view.html
✅ tickets.html
✅ tracking.html

## Уровни защиты

### 🔴 Критический уровень (Активен)
- Блокировка DevTools
- Блокировка копирования
- Блокировка правого клика
- Детектирование отладки

### 🟡 Средний уровень (Опционально)
Можно активировать в `AntiDevTools.js`:

```javascript
// Обфускация текста (добавление невидимых символов)
window.addEventListener('load', obfuscateText);

// Очистка storage при закрытии
window.addEventListener('beforeunload', function(e) {
    localStorage.clear();
    sessionStorage.clear();
});
```

### 🟢 Базовый уровень (Рекомендации)
- Минификация JavaScript кода
- Обфускация переменных и функций
- Удаление комментариев
- Использование webpack/rollup для сборки

## Обход защиты

### ⚠️ Известные способы обхода:

1. **Открытие DevTools до загрузки страницы**
   - Защита: детектирование через размер окна

2. **Использование расширений браузера**
   - Защита: частично, через детектирование debugger

3. **Просмотр исходников через Proxy**
   - Защита: нет (требуется серверная защита)

4. **Сохранение страницы через браузер**
   - Защита: блокировка Ctrl+S

## Рекомендации по усилению защиты

### 1. Серверная защита
```javascript
// Добавить проверку Referer и Origin
app.use((req, res, next) => {
    const allowedOrigins = ['https://fearproject.ru'];
    const origin = req.headers.origin;
    
    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
});
```

### 2. Обфускация кода
```bash
# Использовать javascript-obfuscator
npm install -g javascript-obfuscator

javascript-obfuscator input.js --output output.js \
    --compact true \
    --control-flow-flattening true \
    --dead-code-injection true \
    --string-array true
```

### 3. Минификация
```bash
# Использовать terser
npm install -g terser

terser input.js -o output.min.js \
    --compress \
    --mangle \
    --toplevel
```

### 4. Webpack защита
```javascript
// webpack.config.js
module.exports = {
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                        drop_debugger: true
                    },
                    mangle: true
                }
            })
        ]
    }
};
```

## Тестирование защиты

### Проверка работы:

1. **Попытка открыть DevTools (F12)**
   - Ожидается: ничего не происходит

2. **Правый клик мыши**
   - Ожидается: контекстное меню не появляется

3. **Ctrl+U (View Source)**
   - Ожидается: ничего не происходит

4. **Выделение текста**
   - Ожидается: текст не выделяется

5. **Открытие DevTools через меню браузера**
   - Ожидается: экран "Доступ запрещён" через 1-2 секунды

## Важные замечания

⚠️ **Внимание:**
- Защита не является 100% надёжной
- Опытный разработчик может обойти клиентскую защиту
- Для полной защиты нужна серверная валидация
- Не храните критичные данные в клиентском коде

✅ **Что защищено:**
- Логика работы приложения
- API endpoints (частично)
- Структура данных
- Алгоритмы обработки

❌ **Что НЕ защищено:**
- Сетевые запросы (видны в Network)
- Токены в localStorage (можно прочитать)
- HTML структура (можно сохранить до загрузки JS)

## Поддержка

Если нужно отключить защиту для разработки:

```javascript
// В начале AntiDevTools.js добавить:
if (window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1') {
    console.log('Development mode - protection disabled');
    return;
}
```

## Версия

Текущая версия: **v1**
Дата создания: 2026-05-08
