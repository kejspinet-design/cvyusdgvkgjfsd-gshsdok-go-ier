# Документация: Система доступа и логирования

## Обзор изменений

Реализована система полного доступа для главного администратора и автоматическое логирование всех авторизаций в Google Таблицу.

## 1. Главный администратор

### Steam ID главного админа
```
76561199524780327
```

### Привилегии главного админа
- ✅ **Полный доступ** ко всему функционалу сайта
- ✅ **Обход проверки ролей** - доступ предоставляется автоматически
- ✅ **Специальная метка** в профиле: `isMainAdmin: true`
- ✅ **Приоритетное логирование** в Google Таблицу с меткой "ДА" в колонке "Главный админ"

### Как это работает

При авторизации система:
1. Декодирует JWT токен
2. Извлекает Steam ID из поля `client_id`
3. Сравнивает с `ADMIN_STEAM_ID = '76561199524780327'`
4. Если совпадает - предоставляет полный доступ без проверки роли
5. Если не совпадает - проверяет роль пользователя

### Код проверки

```javascript
// В AuthManager.js
const isMainAdmin = steamId === this.ADMIN_STEAM_ID;

if (isMainAdmin) {
    console.log('[AuthManager] ✅ MAIN ADMIN ACCESS - Full access granted');
    this.profile = data;
    this.profile.isMainAdmin = true;
    // ... полный доступ
}
```

## 2. Логирование в Google Таблицу

### Что логируется

При каждой успешной авторизации в Google Таблицу записывается:

| Поле | Описание | Пример |
|------|----------|--------|
| **Дата и время** | Timestamp авторизации | `07.05.2026 15:30:45` |
| **Steam ID** | Steam ID пользователя | `76561199524780327` |
| **Никнейм** | Ник на Fear Protection | `Santa2555555` |
| **Роль** | Роль пользователя | `Админ+` |
| **Токен** | Сокращённый JWT токен | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **Главный админ** | Является ли главным админом | `ДА` / `Нет` |

### Настройка Google Sheets

Подробная инструкция находится в файле: **`GOOGLE-SHEETS-SETUP.md`**

Краткие шаги:
1. Создать Google Таблицу
2. Настроить Apps Script (код в `google-sheets-logger.gs`)
3. Развернуть как веб-приложение
4. Скопировать URL webhook
5. Вставить URL в `AuthManager.js`

### Безопасность логирования

- ✅ Токены сохраняются в **сокращённом виде** (первые 50 символов)
- ✅ Доступ к таблице имеет **только владелец** Google аккаунта
- ✅ Если логирование не удалось, **авторизация всё равно проходит**
- ✅ Используется режим `no-cors` для совместимости с Google Apps Script

## 3. Система ролей для остальных пользователей

### Разрешённые роли

Если пользователь **не является главным админом**, проверяются следующие роли:

```javascript
const allowedRoles = [
    'STAFF',      // Стафф
    'STMODER',    // Ст. Модератор
    'MLMODER',    // Мл. Модератор
    'ADMIN',      // Админ
    'MODER',      // Модератор
    'STADMIN',    // Ст. Админ
    'ADMIN+',     // Админ+ (Latin)
    'Админ+',     // Админ+ (Cyrillic)
    'АДМИН+'      // АДМИН+ (Cyrillic uppercase)
];
```

### Проверка доступа

```javascript
const groupName = data.adminGroup?.group_name || '';
const displayName = data.adminGroup?.group_display_name || '';

const hasAccess = allowedRoles.some(r => 
    groupName.toUpperCase() === r.toUpperCase() || 
    displayName === r
);
```

## 4. Файлы, которые были изменены

### `fear-protection-v2/js/AuthManager.js`
- ✅ Добавлена константа `ADMIN_STEAM_ID`
- ✅ Добавлена константа `GOOGLE_SHEETS_WEBHOOK`
- ✅ Обновлён метод `validateToken()` с проверкой главного админа
- ✅ Добавлен метод `logAuthToGoogleSheets()` для логирования
- ✅ Версия обновлена до `v=13`

### `fear-protection-v2/quotas.html`
- ✅ Обновлена версия AuthManager до `v=13`

### `fear-protection-v2/ban-goals.html`
- ✅ Обновлена версия AuthManager до `v=13`

### Новые файлы

1. **`google-sheets-logger.gs`** - Google Apps Script для приёма данных
2. **`GOOGLE-SHEETS-SETUP.md`** - Инструкция по настройке Google Sheets
3. **`ADMIN-ACCESS-DOCUMENTATION.md`** - Эта документация

## 5. Тестирование

### Проверка доступа главного админа

1. Откройте `admin-access-test.html`
2. Нажмите "Установить токен"
3. Проверьте консоль браузера (F12):
   ```
   [AuthManager] ✅ MAIN ADMIN ACCESS - Full access granted
   ```
4. Перейдите на любую страницу - доступ должен быть предоставлен

### Проверка логирования

1. Настройте Google Sheets (см. `GOOGLE-SHEETS-SETUP.md`)
2. Авторизуйтесь на сайте
3. Проверьте Google Таблицу - должна появиться новая строка
4. Проверьте консоль браузера:
   ```
   [AuthManager] Logging auth to Google Sheets: {...}
   [AuthManager] ✅ Auth logged to Google Sheets
   ```

## 6. Изменение главного админа

Чтобы изменить Steam ID главного админа:

1. Откройте `fear-protection-v2/js/AuthManager.js`
2. Найдите строку:
   ```javascript
   this.ADMIN_STEAM_ID = '76561199524780327';
   ```
3. Замените на новый Steam ID
4. Сохраните файл
5. Очистите кэш браузера (Ctrl+Shift+R)

## 7. Отключение логирования

Чтобы временно отключить логирование в Google Sheets:

1. Откройте `fear-protection-v2/js/AuthManager.js`
2. Найдите метод `logAuthToGoogleSheets()`
3. Добавьте `return;` в начало метода:
   ```javascript
   async logAuthToGoogleSheets(profile, token) {
       return; // Логирование отключено
       // ... остальной код
   }
   ```

## 8. Поддержка

Если возникли проблемы:

1. **Проверьте консоль браузера** (F12) на наличие ошибок
2. **Проверьте Steam ID** - он должен точно совпадать
3. **Проверьте Google Sheets webhook** - URL должен быть правильным
4. **Очистите кэш браузера** - нажмите Ctrl+Shift+R

## 9. Безопасность

⚠️ **ВАЖНО:**
- Не публикуйте Steam ID главного админа в открытом доступе
- Не публикуйте URL Google Sheets webhook
- Регулярно проверяйте логи авторизаций
- При компрометации токена - смените его немедленно
