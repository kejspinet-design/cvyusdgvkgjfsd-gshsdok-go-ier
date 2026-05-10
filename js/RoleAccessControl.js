/**
 * RoleAccessControl - Контроль доступа по ролям
 */

class RoleAccessControl {
    constructor() {
        // Разрешённые роли для доступа к админ-панели
        this.allowedRoles = [
            'STAFF',
            'СТАФФ',
            'СТАФ',
            'STMODER',
            'MLMODER',
            'ADMIN',
            'MODER',
            'MODERATOR',
            'STADMIN',
            'ADMIN+',
            'Админ+',
            'АДМИН+',
            'МОДЕРАТОР',
            'МОДЕР'
        ];
        
        // Разрешённые display names (для отображения)
        this.allowedDisplayNames = [
            'Стафф',
            'Стаф',
            'Staff',
            'Ст. Модер',
            'Ст. Модератор',
            'Мл. Модератор',
            'Админ',
            'Модератор',
            'Ст. Админ',
            'АДМИН+',
            'Админ+',
            'Модер'
        ];
    }
    
    /**
     * Проверка доступа пользователя
     * @returns {Promise<boolean>}
     */
    async checkAccess() {
        const token = localStorage.getItem('fearToken');
        
        if (!token) {
            console.error('[RoleAccessControl] No token found');
            this.redirectToLogin();
            return false;
        }
        
        try {
            // Декодируем токен
            const payload = JSON.parse(atob(token.split('.')[1]));
            const steamId = payload.client_id;
            
            if (!steamId) {
                console.error('[RoleAccessControl] No Steam ID in token');
                this.redirectToLogin();
                return false;
            }
            
            // Загружаем профиль пользователя
            const response = await fetch(`/api/player?steamid=${steamId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('[RoleAccessControl] Failed to load profile:', response.status);
                this.redirectToLogin();
                return false;
            }
            
            const profile = await response.json();
            
            // Проверяем роль
            const hasAccess = this.hasAccess(profile);
            
            if (!hasAccess) {
                console.error('[RoleAccessControl] Access denied for role:', profile.adminGroup?.group_name || profile.role);
                this.showAccessDenied(profile);
                return false;
            }
            
            console.log('[RoleAccessControl] ✓ Access granted for role:', profile.adminGroup?.group_name || profile.role);
            return true;
            
        } catch (error) {
            console.error('[RoleAccessControl] Error checking access:', error);
            this.redirectToLogin();
            return false;
        }
    }
    
    /**
     * Проверка наличия доступа у профиля
     * @param {Object} profile - Профиль пользователя
     * @returns {boolean}
     */
    hasAccess(profile) {
        if (!profile) {
            console.error('[RoleAccessControl] Profile is null or undefined');
            return false;
        }
        
        const groupName = (profile.adminGroup?.group_name || profile.role || '').trim();
        const displayName = (profile.adminGroup?.group_display_name || '').trim();
        
        console.log('[RoleAccessControl] Checking access for:', {
            groupName,
            displayName,
            fullProfile: profile,
            allowedRoles: this.allowedRoles,
            allowedDisplayNames: this.allowedDisplayNames
        });
        
        // Проверяем по group_name (точное совпадение без учёта регистра)
        const groupNameUpper = groupName.toUpperCase();
        for (const role of this.allowedRoles) {
            if (groupNameUpper === role.toUpperCase()) {
                console.log('[RoleAccessControl] ✓ Access granted by group_name (exact match):', groupName, '===', role);
                return true;
            }
        }
        
        // Проверяем по display_name (точное совпадение)
        for (const name of this.allowedDisplayNames) {
            if (displayName === name) {
                console.log('[RoleAccessControl] ✓ Access granted by display_name (exact match):', displayName, '===', name);
                return true;
            }
        }
        
        // Дополнительная проверка: если содержит разрешённую роль
        for (const role of this.allowedRoles) {
            if (groupNameUpper.includes(role.toUpperCase())) {
                console.log('[RoleAccessControl] ✓ Access granted by group_name (contains):', groupName, 'contains', role);
                return true;
            }
        }
        
        for (const name of this.allowedDisplayNames) {
            if (displayName.includes(name)) {
                console.log('[RoleAccessControl] ✓ Access granted by display_name (contains):', displayName, 'contains', name);
                return true;
            }
        }
        
        console.error('[RoleAccessControl] ✗ Access denied - role not in allowed list');
        console.error('[RoleAccessControl] Received groupName:', groupName);
        console.error('[RoleAccessControl] Received displayName:', displayName);
        console.error('[RoleAccessControl] Full profile:', profile);
        return false;
    }
    
    /**
     * Перенаправление на страницу логина
     */
    redirectToLogin() {
        window.location.href = 'login.html';
    }
    
    /**
     * Показать страницу "Доступ запрещён"
     * @param {Object} profile - Профиль пользователя
     */
    showAccessDenied(profile) {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #0f1419;
                color: white;
                font-family: 'Calluna', 'Times New Roman', serif;
                padding: 40px;
                text-align: center;
            ">
                <div style="
                    background: #1a1f2e;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 500px;
                ">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width: 64px; height: 64px; margin-bottom: 20px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    
                    <h1 style="font-size: 24px; margin-bottom: 15px; color: #ef4444;">Доступ запрещён</h1>
                    
                    <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 20px;">
                        У вас нет прав для доступа к админ-панели Fear Protection.
                    </p>
                    
                    <div style="
                        background: rgba(239, 68, 68, 0.1);
                        border: 1px solid rgba(239, 68, 68, 0.3);
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 20px;
                    ">
                        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-bottom: 5px;">Ваша роль:</div>
                        <div style="font-size: 14px; font-weight: 600; color: white;">
                            ${profile.adminGroup?.group_display_name || profile.role || 'Неизвестно'}
                        </div>
                    </div>
                    
                    <p style="font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-bottom: 25px;">
                        Доступ разрешён только для ролей:<br>
                        <strong style="color: #667eea;">Стафф, Мл. Модератор, Модератор, Ст. Модератор, Админ, Ст. Админ, Админ+</strong>
                    </p>
                    
                    <button onclick="window.location.href='login.html'" style="
                        background: #667eea;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        Вернуться к логину
                    </button>
                </div>
            </div>
        `;
    }
}

// Создаём глобальный экземпляр
const roleAccessControl = new RoleAccessControl();

// Автоматическая проверка доступа при загрузке страницы
// (только для страниц админ-панели, не для login.html)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Проверяем, что мы не на странице логина или публичных страницах
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('admin-access-test.html') &&
            !window.location.pathname.includes('cso.html') &&
            !window.location.pathname.includes('anticheat.html') &&
            !window.location.pathname.includes('check.html') &&
            !window.location.pathname.includes('rules.html') &&
            !window.location.pathname.includes('tracking.html') &&
            !window.location.pathname.includes('secret-admins.html')) {
            roleAccessControl.checkAccess();
        }
    });
} else {
    // Проверяем, что мы не на странице логина или публичных страницах
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('admin-access-test.html') &&
        !window.location.pathname.includes('cso.html') &&
        !window.location.pathname.includes('anticheat.html') &&
        !window.location.pathname.includes('check.html') &&
        !window.location.pathname.includes('rules.html') &&
        !window.location.pathname.includes('tracking.html') &&
        !window.location.pathname.includes('secret-admins.html')) {
        roleAccessControl.checkAccess();
    }
}
