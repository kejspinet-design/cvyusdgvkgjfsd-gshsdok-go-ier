/**
 * PunishmentNormsWidget - Виджет для отображения норм наказаний
 * Показывает нормы наказаний для текущей роли пользователя
 */

class PunishmentNormsWidget {
    constructor() {
        this.userProfile = null;
        this.MAIN_ADMIN_STEAM_ID = '76561199524780327'; // Главный админ - показывать все нормы
        this.ROLE_QUOTAS = {
            'Мл. Модератор': { weekly: 20, monthly: 100 },
            'Модератор': { weekly: 25, monthly: 130 },
            'Ст. Модератор': { weekly: 0, monthly: 80 },
            'Ст. Админ': { weekly: 0, monthly: 50 }
        };
        
        this.init();
    }
    
    async init() {
        await this.loadUserProfile();
        this.render();
    }
    
    async loadUserProfile() {
        const token = localStorage.getItem('fearToken');
        if (!token) {
            console.error('[PunishmentNorms] No token found');
            return;
        }
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const steamId = payload.client_id;
            
            if (!steamId) {
                console.error('[PunishmentNorms] No client_id in token');
                return;
            }
            
            const response = await fetch(`/api/player?steamid=${steamId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                this.userProfile = await response.json();
                console.log('[PunishmentNorms] Profile loaded successfully');
            } else {
                console.error('[PunishmentNorms] Failed to load profile:', response.status);
            }
        } catch (error) {
            console.error('[PunishmentNorms] Error loading profile:', error);
        }
    }
    
    render() {
        // Создаём контейнер для виджета
        const container = document.createElement('div');
        container.id = 'punishment-norms-widget';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(30, 30, 30, 0.95);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            min-width: 280px;
            max-width: 400px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
            z-index: 9997;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            max-height: 600px;
            overflow-y: auto;
        `;
        
        if (!this.userProfile) {
            container.innerHTML = `
                <div style="color: rgba(255, 255, 255, 0.7); font-size: 13px; text-align: center;">
                    Загрузка норм наказаний...
                </div>
            `;
            document.body.appendChild(container);
            return;
        }
        
        const steamId = this.userProfile.steamid;
        const role = this.userProfile.adminGroup?.group_display_name || this.userProfile.adminGroup?.group_name || this.userProfile.role;
        
        console.log('[PunishmentNorms] User Steam ID:', steamId);
        console.log('[PunishmentNorms] User role:', role);
        console.log('[PunishmentNorms] Available roles:', Object.keys(this.ROLE_QUOTAS));
        
        // Проверяем, является ли пользователь главным админом
        const isMainAdmin = steamId === this.MAIN_ADMIN_STEAM_ID;
        
        if (isMainAdmin) {
            // Для главного админа НЕ показываем виджет - информация на странице quotas.html
            console.log('[PunishmentNorms] Main admin - widget hidden, see quotas.html page');
            return;
        }
        
        // Для остальных проверяем наличие норм
        const quota = this.ROLE_QUOTAS[role];
        
        console.log('[PunishmentNorms] Quota found for role:', quota);
        
        if (!quota) {
            // Если нет норм - не показываем виджет вообще
            console.log('[PunishmentNorms] No quotas for role:', role, '- widget hidden');
            return;
        }
        
        console.log('[PunishmentNorms] Rendering widget for role:', role);
        
        // Получаем баны пользователя для расчёта прогресса
        this.fetchBansAndRender(container, role, quota);
    }
    
    async fetchBansAndRender(container, role, quota) {
        const token = localStorage.getItem('fearToken');
        if (!token) {
            this.renderBasicWidget(container, role, quota, 0, 0);
            return;
        }
        
        try {
            const response = await fetch('/api/admin/punishments?type=0', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                this.renderBasicWidget(container, role, quota, 0, 0);
                return;
            }
            
            const bans = await response.json();
            
            // Считаем баны за месяц
            const now = new Date();
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            const monthlyBans = bans.filter(ban => {
                const banDate = new Date(ban.created * 1000);
                return banDate >= monthAgo;
            }).length;
            
            const progress = Math.min((monthlyBans / quota.monthly) * 100, 100);
            
            this.renderFullWidget(container, role, quota, monthlyBans, progress);
            
        } catch (error) {
            console.error('[PunishmentNorms] Error fetching bans:', error);
            this.renderBasicWidget(container, role, quota, 0, 0);
        }
    }
    
    renderBasicWidget(container, role, quota, monthlyBans, progress) {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); text-transform: uppercase;">Нормы наказаний</div>
                    <div style="font-size: 11px; color: #667eea; font-weight: 600;">${role}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;">Норма в месяц</div>
                        <div style="font-size: 20px; font-weight: 700; color: white;">${quota.monthly}</div>
                    </div>
                    <div style="width: 1px; height: 40px; background: rgba(255, 255, 255, 0.1);"></div>
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;">Сделано</div>
                        <div style="font-size: 20px; font-weight: 700; color: #667eea;">${monthlyBans}</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    }
    
    renderFullWidget(container, role, quota, monthlyBans, progress) {
        const remaining = Math.max(quota.monthly - monthlyBans, 0);
        const progressColor = progress >= 100 ? '#22c55e' : progress >= 75 ? '#667eea' : '#ef4444';
        
        container.innerHTML = `
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
            </style>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); text-transform: uppercase;">Нормы наказаний</div>
                    <div style="font-size: 11px; color: #667eea; font-weight: 600;">${role}</div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;">Норма</div>
                        <div style="font-size: 20px; font-weight: 700; color: white;">${quota.monthly}</div>
                    </div>
                    <div style="width: 1px; height: 40px; background: rgba(255, 255, 255, 0.1);"></div>
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;">Сделано</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${progressColor};">${monthlyBans}</div>
                    </div>
                    <div style="width: 1px; height: 40px; background: rgba(255, 255, 255, 0.1);"></div>
                    <div style="flex: 1;">
                        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;">Осталось</div>
                        <div style="font-size: 20px; font-weight: 700; color: white;">${remaining}</div>
                    </div>
                </div>
                
                <div style="margin-top: 4px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">Прогресс</span>
                        <span style="font-size: 11px; color: ${progressColor}; font-weight: 600;">${progress.toFixed(1)}%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, ${progressColor}, ${progressColor}); border-radius: 3px; transition: width 0.3s ease;"></div>
                    </div>
                </div>
                
                <a href="quotas.html" style="display: block; text-align: center; padding: 8px; background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 6px; color: #667eea; text-decoration: none; font-size: 12px; font-weight: 600; transition: all 0.3s ease; margin-top: 4px;" onmouseover="this.style.background='rgba(102, 126, 234, 0.2)'" onmouseout="this.style.background='rgba(102, 126, 234, 0.1)'">
                    Подробнее →
                </a>
            </div>
        `;
        document.body.appendChild(container);
    }
    
    renderAllQuotas(container) {
        container.innerHTML = `
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                #punishment-norms-widget::-webkit-scrollbar {
                    width: 6px;
                }
                #punishment-norms-widget::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 3px;
                }
                #punishment-norms-widget::-webkit-scrollbar-thumb {
                    background: rgba(102, 126, 234, 0.5);
                    border-radius: 3px;
                }
                #punishment-norms-widget::-webkit-scrollbar-thumb:hover {
                    background: rgba(102, 126, 234, 0.7);
                }
            </style>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: rgba(30, 30, 30, 0.95); padding-bottom: 8px; z-index: 1;">
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); text-transform: uppercase;">Все нормы наказаний</div>
                    <div style="font-size: 11px; color: #22c55e; font-weight: 600;">👑 Главный админ</div>
                </div>
                
                ${Object.entries(this.ROLE_QUOTAS).map(([roleName, quota]) => `
                    <div style="background: rgba(20, 20, 20, 0.6); border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 8px; padding: 12px;">
                        <div style="font-size: 13px; font-weight: 600; color: #667eea; margin-bottom: 8px;">${roleName}</div>
                        <div style="display: flex; gap: 12px;">
                            <div style="flex: 1;">
                                <div style="font-size: 10px; color: rgba(255, 255, 255, 0.4); margin-bottom: 2px;">Неделя</div>
                                <div style="font-size: 16px; font-weight: 700; color: white;">${quota.weekly || '—'}</div>
                            </div>
                            <div style="width: 1px; background: rgba(255, 255, 255, 0.1);"></div>
                            <div style="flex: 1;">
                                <div style="font-size: 10px; color: rgba(255, 255, 255, 0.4); margin-bottom: 2px;">Месяц</div>
                                <div style="font-size: 16px; font-weight: 700; color: #667eea;">${quota.monthly}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                <a href="quotas.html" style="display: block; text-align: center; padding: 8px; background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 6px; color: #667eea; text-decoration: none; font-size: 12px; font-weight: 600; transition: all 0.3s ease; margin-top: 4px;" onmouseover="this.style.background='rgba(102, 126, 234, 0.2)'" onmouseout="this.style.background='rgba(102, 126, 234, 0.1)'">
                    Подробнее →
                </a>
            </div>
        `;
        document.body.appendChild(container);
    }
}

// Автоматическая инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что пользователь авторизован
    const token = localStorage.getItem('fearToken');
    if (token) {
        new PunishmentNormsWidget();
    }
});
