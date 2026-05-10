# Страница профиля Fear Protection

## Описание
Страница профиля показывает детальную информацию об авторизованном пользователе из API Fear Project.

## Особенности
- **Персональный профиль**: Каждый токен показывает свой профиль
- **Автоматическая загрузка**: Профиль загружается автоматически при открытии страницы
- **Детальная статистика**: Показывает все данные из API
- **Красивый дизайн**: Современный интерфейс с баннером, аватаром и бейджами

## API Endpoint
```
GET https://api.fearproject.ru/profile/{steamid}
```

## Данные профиля

### Основная информация
- **Имя**: `profile.name`
- **Аватар**: `profile.avatar_full`
- **Баннер**: `profile.banner_url`
- **SteamID64**: `profile.steamid`
- **Последняя активность**: `profile.last_activity`

### Статистика
- **Место в рейтинге**: `profile.stats.position`
- **Убийства**: `profile.stats.kills`
- **Смерти**: `profile.stats.deaths`
- **K/D**: Вычисляется как `kills / deaths`
- **Время в игре**: `profile.stats.playtime` (в секундах)
- **Побед**: `profile.stats.round_win`
- **Поражений**: `profile.stats.round_lose`
- **Выстрелов**: `profile.stats.shoots`
- **Попаданий**: `profile.stats.hits`
- **Хедшотов**: `profile.stats.headshots`
- **Ассистов**: `profile.stats.assists`
- **Точность**: Вычисляется как `(hits / shoots) * 100%`

### Бейджи
- **Админ группа**: `profile.adminGroup.group_name`
- **VIP статус**: `profile.vipInfo.isVip`, `profile.vipInfo.group`
- **Faceit уровень**: `profile.faceitLevel.level`

### Статус аккаунта
- **Статус бана**: `profile.banInfo.isBanned`, `profile.banInfo.unbanTimestamp`
- **VIP до**: `profile.vipInfo.expiresAt`
- **Рейтинг**: `profile.stats.value`

### Интеграции
- **Discord**: `profile.discordNickname`
- **Faceit**: `profile.faceitLevel.nickname`, `profile.faceitLevel.profileUrl`

## Как работает

1. При загрузке страницы проверяется наличие токена в `localStorage`
2. Токен декодируется для получения Steam ID пользователя
3. Делается запрос к API `/api/player?steamid={steamid}`
4. Данные отображаются на странице

## Доступ к профилю

### Через выпадающее меню
1. Нажмите на аватар в правом верхнем углу
2. Выберите "Мой профиль"

### Прямая ссылка
```
http://localhost:3002/profile.html
```

## Безопасность

- Каждый токен показывает **только свой** профиль
- Токен хранится в `localStorage` и передаётся через Authorization header
- При отсутствии токена происходит редирект на страницу входа

## Пример использования

```javascript
// Загрузка профиля
async function loadProfile() {
    const token = localStorage.getItem('fearToken');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const steamId = payload.client_id;
    
    const response = await fetch(`/api/player?steamid=${steamId}`);
    const profile = await response.json();
    
    displayProfile(profile);
}
```

## Тестирование

1. Авторизуйтесь с первым токеном
2. Откройте `http://localhost:3002/profile.html`
3. Проверьте, что отображается профиль первого пользователя
4. Выйдите и авторизуйтесь с другим токеном
5. Откройте профиль снова
6. Проверьте, что отображается профиль второго пользователя

## Логирование

В консоли браузера можно увидеть:
```
[Profile] Loading profile for Steam ID: 76561199524780327
[Profile] Profile data: {...}
```

Это помогает отследить, для какого пользователя загружается профиль.
