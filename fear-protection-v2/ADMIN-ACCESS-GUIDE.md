# Руководство по полному доступу администратора

## Информация о токене

**JWT Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI3NjU2MTE5OTUyNDc4MDMyNyIsImlhdCI6MTc3NzgwNzMyNCwiZXhwIjoxNzgwMzk5MzI0fQ.PaLsOYuO-qx0AZcEG-5aQnjdNPUzD2zHFtqVxc4RmNo
```

**Декодированные данные:**
```json
{
  "client_id": "76561199524780327",
  "iat": 1777807324,
  "exp": 1780399324
}
```

**Steam ID**: `76561199524780327`  
**Выдан**: 31 января 2026  
**Истекает**: 1 марта 2026

---

## Способ 1: Автоматическая установка (Рекомендуется)

### Шаг 1: Откройте тестовую страницу
Перейдите по адресу:
```
http://localhost:3002/admin-access-test.html
```

### Шаг 2: Установите токен
Нажмите кнопку **"Установить токен"**

### Шаг 3: Перейдите в админ-панель
Нажмите кнопку **"Перейти в админ-панель"**

✅ **Готово!** Теперь у вас есть полный доступ ко всем функциям.

---

## Способ 2: Ручная установка через консоль браузера

### Шаг 1: Откройте консоль разработчика
- **Chrome/Edge**: `F12` или `Ctrl+Shift+I`
- **Firefox**: `F12` или `Ctrl+Shift+K`

### Шаг 2: Выполните команду
Вставьте и выполните следующий код:

```javascript
localStorage.setItem('fearToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI3NjU2MTE5OTUyNDc4MDMyNyIsImlhdCI6MTc3NzgwNzMyNCwiZXhwIjoxNzgwMzk5MzI0fQ.PaLsOYuO-qx0AZcEG-5aQnjdNPUzD2zHFtqVxc4RmNo');
console.log('✓ Токен установлен!');
```

### Шаг 3: Обновите страницу
Нажмите `F5` или `Ctrl+R`

✅ **Готово!** Токен установлен и активен.

---

## Способ 3: Через страницу логина

### Шаг 1: Откройте страницу логина
```
http://localhost:3002/login.html
```

### Шаг 2: Откройте консоль (F12)

### Шаг 3: Установите токен
```javascript
localStorage.setItem('fearToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI3NjU2MTE5OTUyNDc4MDMyNyIsImlhdCI6MTc3NzgwNzMyNCwiZXhwIjoxNzgwMzk5MzI0fQ.PaLsOYuO-qx0AZcEG-5aQnjdNPUzD2zHFtqVxc4RmNo');
window.location.href = 'admin-panel.html';
```

---

## Проверка доступа

### Проверка через консоль
```javascript
// Проверить наличие токена
const token = localStorage.getItem('fearToken');
console.log('Token:', token ? '✓ Установлен' : '❌ Не установлен');

// Декодировать токен
if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Steam ID:', payload.client_id);
    console.log('Expires:', new Date(payload.exp * 1000).toLocaleString('ru-RU'));
}
```

### Проверка через тестовую страницу
1. Откройте `admin-access-test.html`
2. Проверьте статус токена
3. Нажмите кнопки тестирования API

---

## Доступные страницы

После установки токена вам доступны:

### Основные страницы
- ✅ `admin-panel.html` - Панель управления (мои блокировки)
- ✅ `admins-list.html` - Список всех администраторов
- ✅ `tickets.html` - Все тикеты
- ✅ `my-tickets.html` - Мои тикеты
- ✅ `ban-goals.html` - Цели банов и нормы
- ✅ `discord-search.html` - Поиск по Discord username
- ✅ `ticket-view.html?id={id}` - Просмотр конкретного тикета

### Тестовые страницы
- ✅ `admin-access-test.html` - Тестирование доступа
- ✅ `profile.html?steamid={steamid}` - Профиль игрока

---

## API эндпоинты с полным доступом

### Профиль
```javascript
GET /api/player?steamid=76561199524780327
Headers: { 'Accept': 'application/json' }
```

### Список админов
```javascript
GET /api/admins
Headers: { 
    'Authorization': 'Bearer {token}',
    'Accept': 'application/json' 
}
```

### Баны/муты
```javascript
GET /api/admin/punishments?type=0  // Баны
GET /api/admin/punishments?type=1  // Войс муты
GET /api/admin/punishments?type=2  // Чат муты
Headers: { 
    'Authorization': 'Bearer {token}',
    'Accept': 'application/json' 
}
```

### Тикеты
```javascript
GET /api/reports                    // Все тикеты
GET /api/reports/{id}               // Конкретный тикет
PATCH /api/reports/{id}/close       // Закрыть тикет
Headers: { 
    'Authorization': 'Bearer {token}',
    'Accept': 'application/json' 
}
```

---

## Удаление токена

### Через консоль
```javascript
localStorage.removeItem('fearToken');
console.log('✓ Токен удалён');
location.reload();
```

### Через тестовую страницу
Нажмите кнопку **"Очистить токен"** на странице `admin-access-test.html`

---

## Troubleshooting

### Проблема: "Токен не работает"
**Решение:**
1. Проверьте срок действия токена (истекает 1 марта 2026)
2. Убедитесь, что токен установлен правильно
3. Проверьте консоль на наличие ошибок

### Проблема: "Перенаправляет на login.html"
**Решение:**
1. Откройте консоль (F12)
2. Выполните: `localStorage.getItem('fearToken')`
3. Если `null` - установите токен заново

### Проблема: "API возвращает 401"
**Решение:**
1. Проверьте, что токен установлен
2. Проверьте, что сервер запущен на порту 3002
3. Проверьте заголовки запроса

---

## Быстрый старт (копипаст)

Откройте консоль браузера (F12) и выполните:

```javascript
// Установить токен и перейти в админ-панель
localStorage.setItem('fearToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI3NjU2MTE5OTUyNDc4MDMyNyIsImlhdCI6MTc3NzgwNzMyNCwiZXhwIjoxNzgwMzk5MzI0fQ.PaLsOYuO-qx0AZcEG-5aQnjdNPUzD2zHFtqVxc4RmNo');
window.location.href = 'admin-panel.html';
```

---

## Статус: Готово к использованию! 🎉

**Файлы:**
- ✅ `admin-access-test.html` - Страница тестирования доступа
- ✅ `ADMIN-ACCESS-GUIDE.md` - Это руководство

**Токен действителен до**: 1 марта 2026
