# Steam API Key - Информация

## Текущие ключи в коде

В проекте используются **2 разных Steam API ключа**:

### Ключ 1: `4CE8017CEC2702E4A9200A4BAD93513E`
**Используется в**:
- `fear-protection-v2/anticheat.html` (строка 545)
- `fear-protection-v2/check.html` (строка 210)

### Ключ 2: `E060AF2E30A53F487CD115E1067F9983`
**Используется в**:
- `fear-protection-v2/js/APIClient.js` (строка 13, по умолчанию)
- `fear-protection-v2/js/CheckPage.js` (строка 26)

## Проблема

Ключи **захардкожены** в коде, что:
- ❌ Небезопасно (ключи видны в исходном коде)
- ❌ Сложно менять (нужно редактировать несколько файлов)
- ❌ Могут быть украдены и использованы другими

## Рекомендуемое решение

### 1. Добавить ключ в `.env`

Файл `.env` уже обновлён:
```env
STEAM_API_KEY=4CE8017CEC2702E4A9200A4BAD93513E
```

### 2. Использовать ключ из окружения

В клиентском коде (браузер) нельзя напрямую использовать `.env`, поэтому есть 2 варианта:

#### Вариант A: Прокси через сервер (рекомендуется)
Все запросы к Steam API идут через ваш сервер, который добавляет ключ:

```javascript
// В server.js
app.use('/api/steam-summaries', async (req, res) => {
    const steamIds = req.query.steamids;
    const apiKey = process.env.STEAM_API_KEY;
    
    const response = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamIds}`
    );
    
    const data = await response.json();
    res.json(data);
});
```

#### Вариант B: Передавать ключ при инициализации
Сервер отдаёт ключ клиенту при загрузке страницы:

```javascript
// В server.js
app.get('/api/config', (req, res) => {
    res.json({
        steamApiKey: process.env.STEAM_API_KEY
    });
});

// В клиенте
const config = await fetch('/api/config').then(r => r.json());
const apiClient = new APIClient({
    steamApiKey: config.steamApiKey
});
```

## Текущее состояние

✅ `.env` файл обновлён с ключом `4CE8017CEC2702E4A9200A4BAD93513E`
❌ Код всё ещё использует захардкоженные ключи
❌ Сервер не использует ключ из `.env`

## Как получить свой Steam API ключ

1. Перейдите на https://steamcommunity.com/dev/apikey
2. Войдите в Steam аккаунт
3. Укажите домен (например: `localhost` или `fearproject.ru`)
4. Скопируйте полученный ключ
5. Добавьте в `.env`:
   ```env
   STEAM_API_KEY=ваш_новый_ключ
   ```

## Лимиты Steam API

- **100,000 запросов в день** на один ключ
- **200 запросов в 5 минут** (rate limit)
- При превышении: HTTP 429 (Too Many Requests)

## Безопасность

### ⚠️ НЕ ДЕЛАЙТЕ:
- ❌ Не коммитьте `.env` в git
- ❌ Не публикуйте ключи в открытом коде
- ❌ Не используйте один ключ для разных проектов

### ✅ ДЕЛАЙТЕ:
- ✅ Храните ключи в `.env`
- ✅ Добавьте `.env` в `.gitignore`
- ✅ Используйте разные ключи для dev/prod
- ✅ Ротируйте ключи периодически

## Проверка использования ключа

### Текущее использование в коде:

```bash
# Поиск всех мест где используется steamApiKey
grep -r "steamApiKey" fear-protection-v2/
```

**Результат**:
- `anticheat.html` - строка 545
- `check.html` - строка 210
- `js/APIClient.js` - строка 13 (2 раза)
- `js/CheckPage.js` - строка 26

### Проверка в консоли браузера:

```javascript
// Откройте DevTools (F12) → Console
console.log('Steam API Key:', apiClient?.config?.steamApiKey);
```

## Рекомендации

1. **Краткосрочно** (сейчас):
   - Используйте ключ `4CE8017CEC2702E4A9200A4BAD93513E` (уже в `.env`)
   - Следите за лимитами Steam API

2. **Среднесрочно** (в течение недели):
   - Реализуйте прокси через сервер для Steam API
   - Уберите захардкоженные ключи из клиентского кода

3. **Долгосрочно** (в течение месяца):
   - Получите свой собственный Steam API ключ
   - Настройте мониторинг использования API
   - Добавьте кэширование ответов Steam API

## Мониторинг использования

Steam не предоставляет dashboard для мониторинга, но вы можете:

1. **Логировать запросы** в `server.js`:
```javascript
let steamApiCalls = 0;
app.use('/api/steam-summaries', (req, res, next) => {
    steamApiCalls++;
    console.log(`[Steam API] Total calls today: ${steamApiCalls}`);
    next();
});
```

2. **Обрабатывать rate limits**:
```javascript
if (response.status === 429) {
    console.error('[Steam API] Rate limit exceeded!');
    // Подождать и повторить
}
```

## Заключение

Текущий ключ `4CE8017CEC2702E4A9200A4BAD93513E` работает, но:
- Не защищён (виден в коде)
- Может быть украден
- Лимиты делятся между всеми пользователями

**Рекомендуется**: Реализовать прокси через сервер для безопасного использования Steam API.
