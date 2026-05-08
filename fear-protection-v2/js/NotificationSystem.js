/**
 * Глобальная система уведомлений для отслеживания игроков
 */
class NotificationSystem {
    constructor() {
        this.trackedPlayers = JSON.parse(localStorage.getItem('trackedPlayers') || '[]');
        this.lastPlayerStates = JSON.parse(localStorage.getItem('lastPlayerStates') || '{}');
        this.notifications = [];
        this.notificationId = 0;
        
        this.init();
    }
    
    init() {
        // Создаем контейнер для уведомлений
        this.createNotificationContainer();
        
        // Запускаем проверку каждые 30 секунд
        this.startTracking();
        
        console.log('[NotificationSystem] Initialized');
    }
    
    createNotificationContainer() {
        // Проверяем, есть ли уже контейнер
        if (document.getElementById('notification-container')) {
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.innerHTML = `
            <style>
                #notification-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    pointer-events: none;
                }
                
                .notification {
                    background: rgba(37, 40, 54, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(185, 28, 28, 0.3);
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin-bottom: 12px;
                    min-width: 320px;
                    max-width: 400px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(185, 28, 28, 0.2);
                    transform: translateX(100%);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: auto;
                    cursor: pointer;
                    font-family: 'Calluna', 'Times New Roman', serif;
                }
                
                .notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .notification.online {
                    border-color: rgba(34, 197, 94, 0.4);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(34, 197, 94, 0.2);
                }
                
                .notification.report {
                    border-color: rgba(239, 68, 68, 0.6);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.3);
                    animation: pulse-notification 2s ease-in-out infinite;
                }
                
                @keyframes pulse-notification {
                    0%, 100% {
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.3);
                    }
                    50% {
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(239, 68, 68, 0.5);
                    }
                }
                
                .notification-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                }
                
                .notification-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    border: 2px solid rgba(185, 28, 28, 0.4);
                }
                
                .notification.online .notification-avatar {
                    border-color: rgba(34, 197, 94, 0.6);
                }
                
                .notification.report .notification-avatar {
                    border-color: rgba(239, 68, 68, 0.6);
                }
                
                .notification-info {
                    flex: 1;
                }
                
                .notification-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 2px;
                }
                
                .notification-steamid {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.5);
                    font-family: 'Courier New', monospace;
                }
                
                .notification-icon {
                    width: 24px;
                    height: 24px;
                    color: #dc2626;
                }
                
                .notification.online .notification-icon {
                    color: #22c55e;
                }
                
                .notification.report .notification-icon {
                    color: #ef4444;
                }
                
                .notification-message {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.4;
                }
                
                .notification-server {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-top: 4px;
                    font-style: italic;
                }
                
                .notification-close {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 20px;
                    height: 20px;
                    border: none;
                    background: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 1;
                    transition: color 0.2s ease;
                }
                
                .notification-close:hover {
                    color: rgba(255, 255, 255, 0.8);
                }
            </style>
        `;
        
        document.body.appendChild(container);
    }
    
    async startTracking() {
        // Проверяем только если есть отслеживаемые игроки
        if (this.trackedPlayers.length === 0) {
            setTimeout(() => this.startTracking(), 30000);
            return;
        }
        
        try {
            // Получаем данные серверов и репортов
            const [serversData, reportsData] = await Promise.all([
                this.fetchServers(),
                this.fetchReports()
            ]);
            
            // Проверяем каждого отслеживаемого игрока
            for (const player of this.trackedPlayers) {
                await this.checkPlayerChanges(player, serversData, reportsData);
            }
            
            // Сохраняем текущие состояния
            localStorage.setItem('lastPlayerStates', JSON.stringify(this.lastPlayerStates));
            
        } catch (error) {
            console.error('[NotificationSystem] Error during tracking:', error);
        }
        
        // Планируем следующую проверку
        setTimeout(() => this.startTracking(), 30000);
    }
    
    async fetchServers() {
        try {
            const response = await fetch('/api/fear?action=servers');
            if (!response.ok) throw new Error(`API returned ${response.status}`);
            
            const data = await response.json();
            return Array.isArray(data) ? data : (data.servers || data.data || []);
        } catch (error) {
            console.error('[NotificationSystem] Error fetching servers:', error);
            return [];
        }
    }
    
    async fetchReports() {
        try {
            const response = await fetch('/api/reports');
            if (!response.ok) throw new Error(`API returned ${response.status}`);
            
            const data = await response.json();
            return Array.isArray(data) ? data : (data.reports || data.data || []);
        } catch (error) {
            console.error('[NotificationSystem] Error fetching reports:', error);
            return [];
        }
    }
    
    checkPlayerOnline(steamId, serversData) {
        for (const server of serversData) {
            const liveData = server.live_data || {};
            const players = liveData.players || [];
            
            const found = players.find(p => p.steam_id === steamId);
            if (found) {
                return {
                    online: true,
                    server: server.site_name || 'Unknown Server',
                    serverIp: server.ip || '',
                    serverPort: server.port || '',
                    playerData: found
                };
            }
        }
        return { online: false };
    }
    
    getPlayerReports(steamId, reportsData) {
        return reportsData.filter(report => {
            const intruderSteamId = String(report.intruder_steamid || '').trim();
            const checkSteamId = String(steamId).trim();
            return intruderSteamId === checkSteamId;
        }).length;
    }
    
    async checkPlayerChanges(player, serversData, reportsData) {
        const steamId = player.steamId;
        const lastState = this.lastPlayerStates[steamId] || {};
        
        // Проверяем онлайн статус
        const currentStatus = this.checkPlayerOnline(steamId, serversData);
        const wasOnline = lastState.online || false;
        const isOnline = currentStatus.online;
        
        // Проверяем репорты
        const currentReports = this.getPlayerReports(steamId, reportsData);
        const lastReports = lastState.reports || 0;
        
        // Уведомление о входе в игру
        if (!wasOnline && isOnline) {
            this.showNotification({
                type: 'online',
                player: player,
                message: `Игрок зашел в игру`,
                server: currentStatus.server,
                icon: 'play'
            });
        }
        
        // Уведомление о выходе из игры
        if (wasOnline && !isOnline) {
            this.showNotification({
                type: 'offline',
                player: player,
                message: `Игрок вышел из игры`,
                icon: 'stop'
            });
        }
        
        // Уведомление о новых репортах
        if (currentReports > lastReports) {
            const newReports = currentReports - lastReports;
            this.showNotification({
                type: 'report',
                player: player,
                message: `Получил ${newReports} ${newReports === 1 ? 'новый репорт' : 'новых репорта'}`,
                icon: 'alert'
            });
        }
        
        // Обновляем состояние
        this.lastPlayerStates[steamId] = {
            online: isOnline,
            reports: currentReports,
            server: currentStatus.server || null,
            lastCheck: Date.now()
        };
    }
    
    showNotification(data) {
        const notificationId = ++this.notificationId;
        
        const notification = document.createElement('div');
        notification.className = `notification ${data.type}`;
        notification.id = `notification-${notificationId}`;
        
        const iconSvg = this.getIconSvg(data.icon);
        
        notification.innerHTML = `
            <button class="notification-close" onclick="notificationSystem.closeNotification(${notificationId})">&times;</button>
            <div class="notification-header">
                <img src="${data.player.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}" 
                     alt="${data.player.name}" 
                     class="notification-avatar"
                     onerror="this.src='https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'">
                <div class="notification-info">
                    <div class="notification-name">${data.player.name || 'Unknown'}</div>
                    <div class="notification-steamid">${data.player.steamId}</div>
                </div>
                <div class="notification-icon">${iconSvg}</div>
            </div>
            <div class="notification-message">${data.message}</div>
            ${data.server ? `<div class="notification-server">Сервер: ${data.server}</div>` : ''}
        `;
        
        // Добавляем в контейнер
        const container = document.getElementById('notification-container');
        container.appendChild(notification);
        
        // Показываем с анимацией
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Автоматически скрываем через 8 секунд
        setTimeout(() => {
            this.closeNotification(notificationId);
        }, 8000);
        
        // Клик по уведомлению - переход на страницу отслеживания
        notification.addEventListener('click', (e) => {
            if (!e.target.classList.contains('notification-close')) {
                window.location.href = 'tracking.html';
            }
        });
        
        console.log('[NotificationSystem] Notification shown:', data);
    }
    
    closeNotification(notificationId) {
        const notification = document.getElementById(`notification-${notificationId}`);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }
    }
    
    getIconSvg(iconType) {
        const icons = {
            play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5,3 19,12 5,21"></polygon>
            </svg>`,
            stop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="6" width="12" height="12"></rect>
            </svg>`,
            alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`
        };
        
        return icons[iconType] || icons.alert;
    }
    
    // Обновляем список отслеживаемых игроков
    updateTrackedPlayers() {
        this.trackedPlayers = JSON.parse(localStorage.getItem('trackedPlayers') || '[]');
    }
}

// Глобальная переменная для доступа к системе уведомлений
let notificationSystem;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    notificationSystem = new NotificationSystem();
});

// Обновляем список при изменении localStorage (когда добавляют/удаляют игроков)
window.addEventListener('storage', (e) => {
    if (e.key === 'trackedPlayers' && notificationSystem) {
        notificationSystem.updateTrackedPlayers();
    }
});