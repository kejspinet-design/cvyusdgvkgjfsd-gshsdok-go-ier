/**
 * Notification Manager
 * Fetches and displays notifications from Google Sheets
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    }

    /**
     * Initialize notification system
     */
    async init() {
        console.info('[NotificationManager] Initializing...');
        
        // Check for notifications immediately on page load
        await this.checkNotifications();
        
        // Set up periodic checking (every 5 minutes)
        setInterval(() => this.checkNotifications(), this.checkInterval);
    }

    /**
     * Check for new notifications
     */
    async checkNotifications() {
        try {
            console.info('[NotificationManager] Checking for notifications...');
            
            // Get current page name from URL
            const pageName = this.getCurrentPage();
            
            // Add cache-busting parameter to prevent caching
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/notifications?page=${pageName}&_t=${timestamp}`);
            if (!response.ok) {
                console.warn('[NotificationManager] Failed to fetch notifications:', response.status);
                return;
            }
            
            const data = await response.json();
            this.notifications = data.notifications || [];
            
            console.info('[NotificationManager] Found', this.notifications.length, 'notifications for page:', pageName);
            
            // Show all notifications (they will appear every time the page is loaded)
            for (const notification of this.notifications) {
                this.showNotification(notification);
            }
            
        } catch (error) {
            console.error('[NotificationManager] Error checking notifications:', error);
        }
    }

    /**
     * Get current page name from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        // Remove .html extension
        const pageName = filename.replace('.html', '');
        
        // Map page names
        const pageMap = {
            'index': 'index',
            'anticheat': 'anticheat',
            'check': 'check',
            'tracking': 'tracking',
            'rules': 'rules',
            'watermelon': 'watermelon',
            'secret-menu': 'secret-menu',
            'secret-admins': 'secret-admins',
            'secret-russians': 'secret-russians',
            'secret-login': 'secret-login'
        };
        
        return pageMap[pageName] || pageName;
    }

    /**
     * Get unique ID for notification
     */
    getNotificationId(notification) {
        return `${notification.message}_${notification.type}`;
    }

    /**
     * Show notification modal
     */
    showNotification(notification) {
        console.info('[NotificationManager] Showing notification:', notification);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'notification-modal';
        modal.innerHTML = `
            <div class="notification-overlay"></div>
            <div class="notification-content notification-${notification.type}">
                <div class="notification-header">
                    <span class="notification-icon">${this.getIcon(notification.type)}</span>
                    <span class="notification-title">${this.getTitle(notification.type)}</span>
                    <button class="notification-close" onclick="this.closest('.notification-modal').remove()">✕</button>
                </div>
                <div class="notification-body">
                    ${notification.message}
                </div>
                <div class="notification-footer">
                    <button class="notification-btn" onclick="this.closest('.notification-modal').remove()">Понятно</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles if not already added
        if (!document.getElementById('notification-styles')) {
            this.addStyles();
        }
        
        // Auto-close after 30 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 30000);
    }

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            success: '✅'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get title for notification type
     */
    getTitle(type) {
        const titles = {
            info: 'Информация',
            warning: 'Внимание',
            error: 'Ошибка',
            success: 'Успешно'
        };
        return titles[type] || titles.info;
    }

    /**
     * Add notification styles
     */
    addStyles() {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }

            .notification-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }

            .notification-content {
                position: relative;
                background: linear-gradient(135deg, rgba(26, 26, 36, 0.95) 0%, rgba(18, 18, 26, 0.95) 100%);
                border-radius: 20px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
                overflow: hidden;
            }

            .notification-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 24px 24px 16px 24px;
                border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            }

            .notification-icon {
                font-size: 28px;
            }

            .notification-title {
                flex: 1;
                font-size: 20px;
                font-weight: 700;
                color: white;
            }

            .notification-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .notification-body {
                padding: 24px;
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
                line-height: 1.6;
                white-space: pre-wrap;
            }

            .notification-footer {
                padding: 16px 24px 24px 24px;
                display: flex;
                justify-content: flex-end;
            }

            .notification-btn {
                padding: 12px 32px;
                border: none;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                color: white;
            }

            .notification-info .notification-header {
                border-bottom-color: rgba(59, 130, 246, 0.3);
            }

            .notification-info .notification-btn {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            }

            .notification-info .notification-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
            }

            .notification-warning .notification-header {
                border-bottom-color: rgba(245, 158, 11, 0.3);
            }

            .notification-warning .notification-btn {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            }

            .notification-warning .notification-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
            }

            .notification-error .notification-header {
                border-bottom-color: rgba(239, 68, 68, 0.3);
            }

            .notification-error .notification-btn {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }

            .notification-error .notification-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
            }

            .notification-success .notification-header {
                border-bottom-color: rgba(34, 197, 94, 0.3);
            }

            .notification-success .notification-btn {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            }

            .notification-success .notification-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes slideUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-initialize on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const notificationManager = new NotificationManager();
        notificationManager.init();
    });
}
