# Обновление хедера - Документация

## Что было сделано

### 1. Новая структура хедера

Хедер теперь состоит из двух частей:
- **`.header-top`** - верхняя часть с логотипом и кнопкой профиля
- **`.header-nav`** - навигация под логотипом

### 2. Кнопка профиля

Добавлена квадратная кнопка профиля в правом верхнем углу:
- Квадратный аватар (36x36px с `border-radius: 4px`)
- Имя пользователя
- Роль администратора
- Ссылка на `admin-panel.html`

### 3. Автоматическая загрузка данных профиля

На всех страницах добавлена функция `loadProfileData()`, которая:
1. Извлекает Steam ID из JWT токена
2. Загружает профиль через API `/api/player?steamid=...`
3. Обновляет UI:
   - Аватар (`#profile-avatar`)
   - Имя (`#profile-name`)
   - Роль (`#profile-role`)

### 4. Обновленные страницы

Все страницы с новым хедером:
- ✅ `admin-panel.html`
- ✅ `tickets.html`
- ✅ `ticket-view.html`
- ✅ `my-tickets.html`
- ✅ `admins-list.html`
- ✅ `discord-search.html`
- ✅ `ban-goals.html`

## Структура HTML

```html
<header class="header">
    <div class="header-top">
        <div class="logo-container">
            <img src="./9574.ico" alt="Fear Protection" class="header-logo">
            <span class="logo-text">Fear Protection</span>
        </div>
        
        <a href="admin-panel.html" class="profile-button" id="profile-button">
            <img src="..." alt="Profile" class="profile-avatar" id="profile-avatar">
            <div class="profile-info">
                <span class="profile-name" id="profile-name">Загрузка...</span>
                <span class="profile-role" id="profile-role">Админ</span>
            </div>
        </a>
    </div>
    
    <nav class="header-nav">
        <a href="anticheat.html" class="nav-button">Игроки</a>
        <a href="secret-admins.html" class="nav-button">Админы</a>
        <a href="check.html" class="nav-button">Проверка</a>
        <a href="rules.html" class="nav-button">Правила</a>
        <a href="tracking.html" class="nav-button">Отслеживание</a>
        <a href="admin-panel.html" class="nav-button active">Дашборд</a>
    </nav>
</header>
```

## JavaScript код

```javascript
async function loadProfileData() {
    const token = localStorage.getItem('fearToken');
    if (!token) {
        console.error('[Profile] No token found');
        return;
    }
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const steamId = payload.client_id;
        
        if (!steamId) {
            console.error('[Profile] No client_id in token');
            return;
        }
        
        const response = await fetch(`/api/player?steamid=${steamId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const profile = await response.json();
            
            const avatarEl = document.getElementById('profile-avatar');
            const nameEl = document.getElementById('profile-name');
            const roleEl = document.getElementById('profile-role');
            
            if (avatarEl && profile.avatar) {
                avatarEl.src = profile.avatar;
            }
            
            if (nameEl && profile.name) {
                nameEl.textContent = profile.name;
            }
            
            if (roleEl) {
                const role = profile.adminGroup?.group_name || profile.role || 'Администратор';
                roleEl.textContent = role;
            }
            
            console.log('[Profile] Profile loaded successfully');
        } else {
            console.error('[Profile] Failed to load profile:', response.status);
        }
    } catch (error) {
        console.error('[Profile] Error loading profile:', error);
    }
}

// Вызов при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    // ... остальной код инициализации
});
```

## CSS стили

Основные классы:
- `.header` - контейнер хедера
- `.header-top` - верхняя часть (логотип + профиль)
- `.header-nav` - навигация
- `.profile-button` - кнопка профиля
- `.profile-avatar` - квадратный аватар (36x36px, border-radius: 4px)
- `.profile-info` - контейнер для имени и роли
- `.profile-name` - имя пользователя
- `.profile-role` - роль администратора

## Источник данных

Данные профиля загружаются из:
- **API endpoint**: `/api/player?steamid={steamId}`
- **Steam ID**: извлекается из JWT токена (`payload.client_id`)
- **Роль**: берется из `profile.adminGroup.group_name` или `profile.role`

## Примечания

- Круглый аватар удален
- Навигация теперь под логотипом, а не на одной линии
- Кнопка профиля ведет на `admin-panel.html`
- Все данные загружаются автоматически при загрузке страницы
- Если данные не загрузились, показывается "Загрузка..." и "Админ" по умолчанию
