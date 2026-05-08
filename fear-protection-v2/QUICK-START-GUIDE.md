# 🚀 Быстрый старт - Fear Protection V2

## Запуск сервера

```bash
# Перейдите в директорию
cd fear-protection-v2

# Запустите сервер
node server.js
```

Сервер запустится на `http://localhost:3002`

---

## Вход в систему

### Способ 1: Автоматический (Рекомендуется)

1. Откройте: `http://localhost:3002/admin-access-test.html`
2. Нажмите кнопку **"Установить токен"**
3. Нажмите **"Перейти в админ-панель"**

### Способ 2: Через консоль браузера

1. Откройте любую страницу админ-панели
2. Нажмите `F12` (открыть консоль)
3. Вставьте и выполните:

```javascript
localStorage.setItem('fearToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI3NjU2MTE5OTUyNDc4MDMyNyIsImlhdCI6MTc3NzgwNzMyNCwiZXhwIjoxNzgwMzk5MzI0fQ.PaLsOYuO-qx0AZcEG-5aQnjdNPUzD2zHFtqVxc4RmNo');
window.location.reload();
```

---

## Доступные страницы

### Основные:
- 📊 `admin-panel.html` - Мои блокировки
- 👥 `admins-list.html` - Список админов
- 🎫 `tickets.html` - Все тикеты
- 📝 `my-tickets.html` - Мои тикеты
- 🎯 `ban-goals.html` - Цели банов и нормы
- 🔍 `discord-search.html` - Поиск по Discord

### Тестовые:
- 🔐 `admin-access-test.html` - Тестирование доступа
- 👤 `profile.html?steamid={id}` - Профиль игрока

---

## Использование выпадающего меню профиля

### Открытие меню:
1. Кликните по кнопке профиля в правом верхнем углу
2. Меню откроется с анимацией

### Пункты меню:
- **Мой профиль** - Ваш детальный профиль
- **Админ панель** - Главная страница
- **Профиль на сайте** - Внешняя ссылка
- **Выйти** - Выход из системы

### Закрытие меню:
- Клик вне меню
- Нажатие `ESC`
- Выбор любого пункта

---

## Разрешённые роли

Доступ к админ-панели имеют:
- ✅ Стафф (STAFF)
- ✅ Мл. Модератор (MLMODER)
- ✅ Модератор (MODER)
- ✅ Ст. Модератор (STMODER)
- ✅ Админ (ADMIN)
- ✅ Ст. Админ (STADMIN)
- ✅ Админ+ (ADMIN+)

Если ваша роль не в списке - вы увидите страницу "Доступ запрещён".

---

## Нормы наказаний по ролям

### Мл. Модератор:
- Неделя: 20 банов
- Месяц: 100 банов

### Модератор:
- Неделя: 25 банов
- Месяц: 130 банов

### Ст. Модератор:
- Месяц: 80 банов

### Ст. Админ:
- Месяц: 50 банов

Прогресс отображается на странице **Цели банов**.

---

## API эндпоинты

### Профиль:
```
GET /api/player?steamid={steamId}
```

### Список админов:
```
GET /api/admins
Headers: Authorization: Bearer {token}
```

### Баны/муты:
```
GET /api/admin/punishments?type=0  // Баны
GET /api/admin/punishments?type=1  // Войс муты
GET /api/admin/punishments?type=2  // Чат муты
Headers: Authorization: Bearer {token}
```

### Тикеты:
```
GET /api/reports                    // Все тикеты
GET /api/reports/{id}               // Конкретный тикет
PATCH /api/reports/{id}/close       // Закрыть тикет
Headers: Authorization: Bearer {token}
```

---

## Troubleshooting

### Проблема: "Доступ запрещён"
**Решение:** Проверьте, что ваша роль в списке разрешённых.

### Проблема: "Токен не работает"
**Решение:** 
1. Откройте консоль (F12)
2. Выполните: `localStorage.getItem('fearToken')`
3. Если `null` - установите токен заново

### Проблема: "Меню профиля не открывается"
**Решение:**
1. Проверьте консоль на ошибки (F12)
2. Убедитесь, что все скрипты загружены
3. Обновите страницу (Ctrl+R)

### Проблема: "API возвращает 401"
**Решение:**
1. Проверьте, что токен установлен
2. Проверьте срок действия токена
3. Убедитесь, что сервер запущен

---

## Полезные команды консоли

### Проверить токен:
```javascript
const token = localStorage.getItem('fearToken');
console.log('Token:', token ? '✓ Установлен' : '❌ Не установлен');
```

### Декодировать токен:
```javascript
const token = localStorage.getItem('fearToken');
if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Steam ID:', payload.client_id);
    console.log('Expires:', new Date(payload.exp * 1000).toLocaleString('ru-RU'));
}
```

### Удалить токен:
```javascript
localStorage.removeItem('fearToken');
location.reload();
```

---

## Документация

Подробная документация:
- 📄 `PROFILE-DROPDOWN-COMPLETE.md` - Выпадающее меню профиля
- 📄 `BAN-QUOTAS-SYSTEM.md` - Система норм наказаний
- 📄 `ADMIN-ACCESS-GUIDE.md` - Руководство по доступу
- 📄 `LAYOUT-UPDATE-SUMMARY.md` - Обновление layout

---

## Статус: ✅ Готово к использованию!

**Версия:** 2.0  
**Дата:** Январь 2026  
**Токен действителен до:** 1 марта 2026

🎉 **Приятной работы!**
