/**
 * Менеджер авторизации для Fear Protection
 */
class AuthManager {
    constructor() {
        this.token = null;
        this.profile = null;
        this.ADMIN_STEAM_ID = '76561199524780327'; // Главный админ с полным доступом
        this.GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbzeLXN5jF_s54GpSDmTDU5WC7nTmE1r8k492pDFTkPnDa4BYLOa4XrubTICDN1tT1Uo/exec';
        this.init();
    }
    
    init() {
        // Проверяем авторизацию при загрузке страницы
        this.checkAuth();
    }
    
    async checkAuth() {
        // Получаем токен из localStorage
        this.token = localStorage.getItem('fearToken');
        
        // Если токена нет - редирект на login
        if (!this.token) {
            this.redirectToLogin();
            return false;
        }
        
        // Быстрая проверка: загружаем профиль из кэша
        const cachedProfile = localStorage.getItem('fearProfile');
        if (cachedProfile) {
            try {
                this.profile = JSON.parse(cachedProfile);
                console.log('[AuthManager] ✅ Using cached profile - instant load');
                
                // Проверяем токен в фоне через 5 секунд (не блокируем загрузку)
                setTimeout(() => {
                    this.validateToken().then(isValid => {
                        if (!isValid) {
                            console.log('[AuthManager] Token expired, logging out');
                            this.logout();
                        }
                    }).catch(err => {
                        console.error('[AuthManager] Background validation error:', err);
                    });
                }, 5000);
                
                return true;
            } catch (e) {
                console.error('[AuthManager] Failed to parse cached profile:', e);
            }
        }
        
        // Если кэша нет - проверяем токен (только первый раз)
        const isValid = await this.validateToken();
        
        if (!isValid) {
            this.logout();
            return false;
        }
        
        return true;
    }
    
    async validateToken() {
        try {
            console.log('[AuthManager] Validating token...');
            
            // Декодируем JWT токен чтобы получить Steam ID
            let steamId;
            try {
                const payload = JSON.parse(atob(this.token.split('.')[1]));
                steamId = payload.client_id;
                console.log('[AuthManager] Extracted Steam ID from token:', steamId);
            } catch (e) {
                console.error('[AuthManager] Failed to decode token:', e);
                return false;
            }
            
            if (!steamId) {
                console.error('[AuthManager] No client_id in token');
                return false;
            }
            
            // Используем прокси через наш сервер для получения профиля
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут (вместо 5)
            
            const response = await fetch(`/api/player?steamid=${steamId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('[AuthManager] Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[AuthManager] Profile data received');
                
                // Проверяем, является ли пользователь главным админом
                const isMainAdmin = steamId === this.ADMIN_STEAM_ID;
                
                if (isMainAdmin) {
                    console.log('[AuthManager] ✅ MAIN ADMIN ACCESS - Full access granted');
                    this.profile = data;
                    this.profile.isMainAdmin = true;
                    localStorage.setItem('fearProfile', JSON.stringify(this.profile));
                    
                    // Логируем в фоне (не блокируем)
                    this.logAuthInBackground(data, this.token);
                    
                    return true;
                }
                
                // Для остальных проверяем роль
                const role = data.adminGroup?.group_name || data.role || data.user_role || data.group || '';
                console.log('[AuthManager] User role:', role);
                
                // Разрешенные роли
                const allowedRoles = [
                    'STAFF', 'STMODER', 'MLMODER', 'ADMIN', 'MODER', 'STADMIN', 'ADMIN+',
                    'Админ+', 'АДМИН+', 'Стафф', 'Ст. Модер', 'Мл. Модератор', 'Админ',
                    'Модератор', 'Ст. Админ', 'MODERATOR', 'МОДЕРАТОР', 'МОДЕР', 'Модер', 'Ст. Модератор'
                ];
                
                const groupName = data.adminGroup?.group_name || '';
                const displayName = data.adminGroup?.group_display_name || '';
                
                const hasAccess = allowedRoles.some(r => 
                    groupName.toUpperCase() === r.toUpperCase() || 
                    displayName === r
                );
                
                if (!hasAccess) {
                    console.error('[AuthManager] Access denied - insufficient role:', role);
                    return false;
                }
                
                this.profile = data;
                this.profile.isMainAdmin = false;
                localStorage.setItem('fearProfile', JSON.stringify(data));
                
                // Логируем в фоне (не блокируем)
                this.logAuthInBackground(data, this.token);
                
                console.log('[AuthManager] ✅ Token valid, access granted');
                return true;
            }
            
            console.error('[AuthManager] API error:', response.status);
            return false;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('[AuthManager] Request timeout - server may be slow');
            } else {
                console.error('[AuthManager] Token validation error:', error);
            }
            // Если есть кэш - не выкидываем пользователя
            if (this.profile) {
                console.warn('[AuthManager] Using cached profile due to validation error');
                return true;
            }
            return false;
        }
    }
    
    /**
     * Логирование в фоне (не блокирует загрузку)
     */
    logAuthInBackground(data, token) {
        // Логируем каждый вход на сайт
        setTimeout(() => {
            this.logAuthToGoogleSheets(data, token).then(() => {
                console.log('[AuthManager] ✅ Login logged to Google Sheets');
            }).catch(err => {
                console.warn('[AuthManager] Failed to log to Google Sheets:', err);
            });
        }, 10000); // Задержка 10 секунд после загрузки
    }
    
    /**
     * Логирование авторизации в Google Таблицу
     */
    async logAuthToGoogleSheets(profile, token) {
        try {
            const role = profile.adminGroup?.group_display_name || profile.adminGroup?.group_name || profile.role || 'Unknown';
            const steamId = profile.steamid || 'Unknown';
            const nickname = profile.name || 'Unknown';
            const timestamp = new Date().toISOString();
            
            const data = {
                timestamp: timestamp,
                steamId: steamId,
                nickname: nickname,
                role: role,
                isMainAdmin: steamId === this.ADMIN_STEAM_ID
            };
            
            console.log('[AuthManager] Logging auth to Google Sheets:', data);
            
            // Отправляем данные в Google Sheets через webhook с таймаутом
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут
            
            await fetch(this.GOOGLE_SHEETS_WEBHOOK, {
                method: 'POST',
                mode: 'no-cors', // Важно для Google Apps Script
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('[AuthManager] ✅ Auth logged to Google Sheets');
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('[AuthManager] Google Sheets logging timeout');
            } else {
                console.error('[AuthManager] Failed to log auth to Google Sheets:', error);
            }
            // Не прерываем авторизацию если логирование не удалось
        }
    }
    
    async loadProfile() {
        // Пытаемся загрузить из localStorage
        const savedProfile = localStorage.getItem('fearProfile');
        
        if (savedProfile) {
            try {
                this.profile = JSON.parse(savedProfile);
            } catch (error) {
                console.error('[AuthManager] Error parsing saved profile:', error);
            }
        }
        
        // Если профиля нет, загружаем с API
        if (!this.profile) {
            await this.validateToken();
        }
    }
    
    logout() {
        // Очищаем данные
        localStorage.removeItem('fearToken');
        localStorage.removeItem('fearProfile');
        this.token = null;
        this.profile = null;
        
        // Редирект на login
        this.redirectToLogin();
    }
    
    redirectToLogin() {
        // Проверяем, не находимся ли мы уже на странице login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
    
    getToken() {
        return this.token;
    }
    
    getProfile() {
        return this.profile;
    }
    
    getRoleDisplay(role) {
        if (!role) return 'Администратор';
        
        const roleMap = {
            'owner': 'Владелец',
            'superadmin': 'Супер Админ',
            'admin': 'Администратор',
            'administrator': 'Администратор',
            'moderator': 'Модератор',
            'админ': 'Администратор'
        };
        
        const roleLower = role.toLowerCase();
        for (const [key, value] of Object.entries(roleMap)) {
            if (roleLower.includes(key)) {
                return value;
            }
        }
        
        return role;
    }
}

// Глобальная переменная для доступа к менеджеру авторизации
let authManager;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('[AuthManager] DOMContentLoaded fired');
    console.log('[AuthManager] Current path:', window.location.pathname);
    
    // Не инициализируем на странице login
    if (!window.location.pathname.includes('login.html')) {
        console.log('[AuthManager] Initializing AuthManager...');
        authManager = new AuthManager();
    } else {
        console.log('[AuthManager] Skipping initialization on login page');
    }
});
