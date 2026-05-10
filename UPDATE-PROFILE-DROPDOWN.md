# Обновление профиля с выпадающим меню

## Что было сделано:

### 1. Создан CSS для выпадающего меню
**Файл**: `css/profile-dropdown.css`
- Стили для кнопки профиля
- Стили для выпадающего меню
- Анимация появления
- Адаптивный дизайн

### 2. Создан JavaScript модуль
**Файл**: `js/ProfileDropdown.js`
- Класс `ProfileDropdown` для управления меню
- Автоматическая загрузка профиля
- Обработка кликов и закрытия меню
- Функция выхода из системы

### 3. Структура выпадающего меню

```
┌─────────────────────────────────────┐
│  [Avatar]  Santa2555555             │
│            АДМИН+                   │
├─────────────────────────────────────┤
│  👤  Мой профиль                    │
│  📊  Админ панель                   │
│  🔗  Профиль на сайте               │
├─────────────────────────────────────┤
│  🚪  Выйти                          │
└─────────────────────────────────────┘
```

## Изменения в HTML:

### Было (ссылка):
```html
<a href="admin-panel.html" class="profile-button" id="profile-button">
    <img src="..." class="profile-avatar" id="profile-avatar">
    <div class="profile-info">
        <span class="profile-name" id="profile-name">Загрузка...</span>
        <span class="profile-role" id="profile-role">Админ</span>
    </div>
</a>
```

### Стало (кнопка):
```html
<button type="button" class="profile-button" id="profile-button">
    <img src="..." class="profile-avatar" id="profile-avatar">
    <div class="profile-info">
        <span class="profile-name" id="profile-name">Загрузка...</span>
        <span class="profile-role" id="profile-role">Админ</span>
    </div>
</button>
```

## Страницы для обновления:

- [x] admin-panel.html
- [ ] tickets.html
- [ ] my-tickets.html
- [ ] admins-list.html
- [ ] discord-search.html
- [ ] ban-goals.html
- [ ] ticket-view.html

## Инструкция по обновлению страницы:

### Шаг 1: Добавить CSS
```html
<link rel="stylesheet" href="css/profile-dropdown.css?v=1">
```

### Шаг 2: Изменить кнопку профиля
Заменить `<a href="..." class="profile-button"` на `<button type="button" class="profile-button"`

### Шаг 3: Добавить скрипт
```html
<script src="js/ProfileDropdown.js?v=1"></script>
```

### Шаг 4: Удалить дублирующий код
Удалить функцию `loadProfileData()` если она есть в скрипте страницы, так как ProfileDropdown уже загружает профиль.

## Функционал:

### Открытие меню
- Клик по кнопке профиля
- Меню появляется под кнопкой

### Закрытие меню
- Клик вне меню
- Нажатие ESC
- Клик по пункту меню

### Пункты меню:
1. **Мой профиль** - переход на `profile.html?steamid={steamId}`
2. **Админ панель** - переход на `admin-panel.html`
3. **Профиль на сайте** - открывает `https://fearprotection.ru/profile` в новой вкладке
4. **Выйти** - удаляет токен и перенаправляет на `login.html`

## Статус: В процессе

**Обновлено страниц**: 1 из 7
