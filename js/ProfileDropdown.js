/**
 * ProfileDropdown - Управление выпадающим меню профиля
 */

class ProfileDropdown {
    constructor() {
        this.isOpen = false;
        this.profileButton = null;
        this.dropdown = null;
        this.userProfile = null;
        
        this.init();
    }
    
    init() {
        // Ждём загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.createDropdown();
        this.attachEventListeners();
        this.loadProfile();
    }
    
    createDropdown() {
        // Находим кнопку профиля
        this.profileButton = document.getElementById('profile-button');
        if (!this.profileButton) {
            console.error('[ProfileDropdown] Profile button not found');
            return;
        }
        
        // Проверяем, не создан ли уже dropdown
        const existingDropdown = document.getElementById('profile-dropdown');
        if (existingDropdown) {
            console.log('[ProfileDropdown] Dropdown already exists, reusing');
            this.dropdown = existingDropdown;
            return;
        }
        
        // Создаём контейнер
        const container = document.createElement('div');
        container.className = 'profile-container';
        
        // Оборачиваем кнопку в контейнер
        this.profileButton.parentNode.insertBefore(container, this.profileButton);
        container.appendChild(this.profileButton);
        
        // Создаём выпадающее меню
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'profile-dropdown';
        this.dropdown.id = 'profile-dropdown';
        
        this.dropdown.innerHTML = `
            <div class="dropdown-header">
                <img src="https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg" 
                     class="dropdown-avatar" 
                     id="dropdown-avatar"
                     onerror="this.src='https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'">
                <div class="dropdown-user-info">
                    <div class="dropdown-name" id="dropdown-name">Загрузка...</div>
                    <div class="dropdown-role" id="dropdown-role">Админ</div>
                </div>
            </div>
            
            <div class="dropdown-menu">
                <a href="admin-panel.html" class="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                    Админ панель
                </a>
                
                <a href="https://fearprotection.ru/profile" target="_blank" class="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Профиль на сайте
                </a>
                
                <div class="dropdown-divider"></div>
                
                <a href="#" class="dropdown-item logout" onclick="profileDropdown.logout(); return false;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Выйти
                </a>
            </div>
        `;
        
        container.appendChild(this.dropdown);
        console.log('[ProfileDropdown] Dropdown created successfully');
    }
    
    attachEventListeners() {
        if (!this.profileButton || !this.dropdown) {
            console.error('[ProfileDropdown] Cannot attach listeners - missing elements');
            return;
        }
        
        // Клик по кнопке профиля
        this.profileButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });
        
        // Клик вне меню - закрыть
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.dropdown.contains(e.target) && !this.profileButton.contains(e.target)) {
                this.close();
            }
        });
        
        // ESC - закрыть
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        console.log('[ProfileDropdown] Event listeners attached');
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        if (!this.dropdown) return;
        
        this.dropdown.classList.add('show');
        this.profileButton.classList.add('active');
        this.isOpen = true;
        
        console.log('[ProfileDropdown] Opened');
    }
    
    close() {
        if (!this.dropdown) return;
        
        this.dropdown.classList.remove('show');
        this.profileButton.classList.remove('active');
        this.isOpen = false;
        
        console.log('[ProfileDropdown] Closed');
    }
    
    getSteamId() {
        const token = localStorage.getItem('fearToken');
        if (!token) return '';
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.client_id || '';
        } catch (error) {
            console.error('[ProfileDropdown] Error decoding token:', error);
            return '';
        }
    }
    
    async loadProfile() {
        // Используем кэшированный профиль из localStorage (уже загружен AuthManager)
        const cachedProfile = localStorage.getItem('fearProfile');
        
        if (cachedProfile) {
            try {
                this.userProfile = JSON.parse(cachedProfile);
                this.updateUI();
                console.log('[ProfileDropdown] Profile loaded from cache (instant)');
                return;
            } catch (error) {
                console.error('[ProfileDropdown] Error parsing cached profile:', error);
            }
        }
        
        // Если кэша нет (не должно быть, но на всякий случай)
        console.warn('[ProfileDropdown] No cached profile found, this should not happen');
    }
    
    updateUI() {
        if (!this.userProfile) return;
        
        // Обновляем кнопку профиля в header
        const headerAvatar = document.getElementById('profile-avatar');
        const headerName = document.getElementById('profile-name');
        const headerRole = document.getElementById('profile-role');
        
        if (headerAvatar && this.userProfile.avatar) {
            headerAvatar.src = this.userProfile.avatar;
        }
        
        if (headerName && this.userProfile.name) {
            headerName.textContent = this.userProfile.name;
        }
        
        if (headerRole) {
            const role = this.userProfile.adminGroup?.group_name || this.userProfile.role || 'Администратор';
            headerRole.textContent = role;
        }
        
        // Обновляем dropdown
        const dropdownAvatar = document.getElementById('dropdown-avatar');
        const dropdownName = document.getElementById('dropdown-name');
        const dropdownRole = document.getElementById('dropdown-role');
        
        if (dropdownAvatar && this.userProfile.avatar) {
            dropdownAvatar.src = this.userProfile.avatar;
        }
        
        if (dropdownName && this.userProfile.name) {
            dropdownName.textContent = this.userProfile.name;
        }
        
        if (dropdownRole) {
            const role = this.userProfile.adminGroup?.group_name || this.userProfile.role || 'Администратор';
            dropdownRole.textContent = role;
        }
    }
    
    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('fearToken');
            console.log('[ProfileDropdown] Logged out');
            window.location.href = 'login.html';
        }
    }
}

// Создаём глобальный экземпляр
let profileDropdown;

// Инициализируем при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        profileDropdown = new ProfileDropdown();
    });
} else {
    profileDropdown = new ProfileDropdown();
}
