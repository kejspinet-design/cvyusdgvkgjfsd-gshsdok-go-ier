// Глобальная система уведомлений о целях банов
class BanGoalsNotifier {
    constructor() {
        this.currentGoal = null;
        this.lastCheck = null;
        this.checkInterval = 30000; // 30 секунд
        this.notificationContainer = null;
        this.discordProfilesCache = [];
        this.isDiscordCacheLoaded = false;
        
        this.init();
    }
    
    init() {
        // Создаём контейнер для уведомлений
        this.createNotificationContainer();
        
        // Загружаем цель
        this.loadGoal();
        
        // Проверяем прогресс
        this.checkProgress();
        
        // Запускаем периодическую проверку
        setInterval(() => this.checkProgress(), this.checkInterval);
        
        // Загружаем Discord профили в фоне
        this.loadDiscordProfilesInBackground();
        
        // Проверяем возраст кэша каждый час и обновляем если нужно
        setInterval(() => this.checkCacheAge(), 60 * 60 * 1000); // Каждый час
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'ban-goals-notifications';
        container.style.cssText = `
            position: fixed;
            bottom: 380px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
        document.body.appendChild(container);
        this.notificationContainer = container;
    }
    
    loadGoal() {
        const savedGoal = localStorage.getItem('banGoal');
        if (savedGoal) {
            this.currentGoal = JSON.parse(savedGoal);
        }
    }
    
    saveGoal() {
        if (this.currentGoal) {
            localStorage.setItem('banGoal', JSON.stringify(this.currentGoal));
        }
    }
    
    async checkProgress() {
        if (!this.currentGoal || this.currentGoal.status !== 'active') {
            return;
        }
        
        const token = localStorage.getItem('fearToken');
        if (!token) {
            return;
        }
        
        try {
            // Получаем баны пользователя
            const response = await fetch('/api/admin/punishments?type=0', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                return;
            }
            
            const bans = await response.json();
            
            // Считаем баны с момента начала цели
            const startDate = new Date(this.currentGoal.startDate);
            const bansInPeriod = bans.filter(ban => {
                const banDate = new Date(ban.created * 1000);
                return banDate >= startDate;
            });
            
            const oldCount = this.currentGoal.currentCount || 0;
            this.currentGoal.currentCount = bansInPeriod.length;
            
            // Проверяем, достигнута ли цель
            if (this.currentGoal.currentCount >= this.currentGoal.targetCount && oldCount < this.currentGoal.targetCount) {
                this.currentGoal.status = 'completed';
                this.showNotification('🎉 Цель выполнена!', `Вы достигли цели: ${this.currentGoal.targetCount} банов за ${this.currentGoal.periodDays} дней!`, 'success');
            } else if (new Date() > new Date(this.currentGoal.endDate) && this.currentGoal.status === 'active') {
                this.currentGoal.status = 'failed';
                this.showNotification('⏰ Время истекло', `Цель не выполнена. Выполнено: ${this.currentGoal.currentCount}/${this.currentGoal.targetCount}`, 'error');
            } else if (this.currentGoal.currentCount > oldCount) {
                // Новый бан - показываем уведомление
                const remaining = this.currentGoal.targetCount - this.currentGoal.currentCount;
                const progress = Math.round((this.currentGoal.currentCount / this.currentGoal.targetCount) * 100);
                this.showNotification('✓ Прогресс обновлён', `${this.currentGoal.currentCount}/${this.currentGoal.targetCount} банов (${progress}%)\nОсталось: ${remaining}`, 'info');
            }
            
            this.saveGoal();
            
        } catch (error) {
            console.error('[Ban Goals Notifier] Error checking progress:', error);
        }
    }
    
    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'ban-goal-notification';
        
        let bgColor = 'rgba(102, 126, 234, 0.95)';
        let borderColor = '#667eea';
        
        if (type === 'success') {
            bgColor = 'rgba(34, 197, 94, 0.95)';
            borderColor = '#22c55e';
        } else if (type === 'error') {
            bgColor = 'rgba(239, 68, 68, 0.95)';
            borderColor = '#ef4444';
        }
        
        notification.style.cssText = `
            background: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            animation: slideIn 0.3s ease;
            cursor: pointer;
            transition: transform 0.2s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
                <div style="flex: 1;">
                    <div style="font-size: 14px; font-weight: 700; margin-bottom: 4px; color: white;">
                        ${title}
                    </div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.9); white-space: pre-line;">
                        ${message}
                    </div>
                </div>
                <div style="font-size: 18px; cursor: pointer; color: white; opacity: 0.7; line-height: 1;" onclick="this.parentElement.parentElement.remove()">
                    ×
                </div>
            </div>
        `;
        
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'scale(1.02)';
        });
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'scale(1)';
        });
        
        notification.addEventListener('click', (e) => {
            if (e.target.tagName !== 'DIV' || e.target.textContent !== '×') {
                window.location.href = 'ban-goals.html';
            }
        });
        
        // Добавляем уведомление в конец (старые сверху, новые снизу)
        this.notificationContainer.appendChild(notification);
        
        // Автоматически убираем через 10 секунд
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
        
        // Добавляем анимации
        if (!document.getElementById('ban-goals-animations')) {
            const style = document.createElement('style');
            style.id = 'ban-goals-animations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Показать мини-виджет прогресса
    showProgressWidget() {
        if (!this.currentGoal || this.currentGoal.status !== 'active') {
            return;
        }
        
        const progress = Math.min((this.currentGoal.currentCount / this.currentGoal.targetCount) * 100, 100);
        const remaining = Math.max(this.currentGoal.targetCount - this.currentGoal.currentCount, 0);
        
        const widget = document.createElement('div');
        widget.id = 'ban-goals-widget';
        widget.style.cssText = `
            position: fixed;
            bottom: 200px;
            right: 20px;
            background: rgba(26, 31, 46, 0.95);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 12px;
            padding: 16px;
            width: 280px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            z-index: 9998;
            cursor: pointer;
            transition: transform 0.2s ease;
        `;
        
        widget.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size: 12px; font-weight: 700; color: white;">Цель банов</div>
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6);">${this.currentGoal.currentCount}/${this.currentGoal.targetCount}</div>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                <div style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); width: ${progress}%; transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 11px; color: rgba(255, 255, 255, 0.7);">
                Осталось: ${remaining} банов
            </div>
        `;
        
        widget.addEventListener('mouseenter', () => {
            widget.style.transform = 'scale(1.05)';
        });
        
        widget.addEventListener('mouseleave', () => {
            widget.style.transform = 'scale(1)';
        });
        
        widget.addEventListener('click', () => {
            window.location.href = 'ban-goals.html';
        });
        
        // Удаляем старый виджет если есть
        const oldWidget = document.getElementById('ban-goals-widget');
        if (oldWidget) {
            oldWidget.remove();
        }
        
        document.body.appendChild(widget);
    }
    
    // Показать уведомление о загрузке Discord кэша
    showDiscordCacheNotification() {
        // Проверяем, не показано ли уже уведомление
        if (document.getElementById('discord-cache-notification')) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.id = 'discord-cache-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 520px;
            right: 20px;
            background: rgba(26, 31, 46, 0.95);
            border: 1px solid rgba(102, 126, 234, 0.3);
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            z-index: 9996;
            opacity: 0;
            transform: translateX(400px);
            min-width: 300px;
            max-width: 350px;
            transition: opacity 0.3s ease, transform 0.3s ease, bottom 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <svg style="width: 20px; height: 20px; color: #667eea;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span style="font-size: 13px; font-weight: 700; color: white;">Загрузка Discord профилей</span>
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-bottom: 10px;">Загружаем профили админов для быстрого поиска...</div>
            <div style="width: 100%; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                <div id="cache-progress-fill" style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <div id="cache-notification-footer" style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">Инициализация...</div>
        `;
        
        // Добавляем анимацию
        if (!document.getElementById('discord-cache-animations')) {
            const style = document.createElement('style');
            style.id = 'discord-cache-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Показываем уведомление с анимацией
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Проверяем позицию виджета целей банов
        const adjustPosition = () => {
            const banGoalsWidget = document.getElementById('ban-goals-widget');
            const normsWidget = document.getElementById('punishment-norms-widget');
            
            if (banGoalsWidget && banGoalsWidget.offsetParent !== null && normsWidget && normsWidget.offsetParent !== null) {
                // Если есть оба виджета, размещаем уведомление выше них
                notification.style.bottom = '520px';
            } else if (banGoalsWidget && banGoalsWidget.offsetParent !== null) {
                // Если есть только виджет целей банов
                notification.style.bottom = '200px';
            } else if (normsWidget && normsWidget.offsetParent !== null) {
                // Если есть только виджет норм
                notification.style.bottom = '200px';
            } else {
                // Если нет виджетов
                notification.style.bottom = '20px';
            }
        };
        
        const positionInterval = setInterval(adjustPosition, 500);
        
        // Мониторим загрузку кэша
        let checkCount = 0;
        const maxChecks = 600;
        
        const checkInterval = setInterval(() => {
            checkCount++;
            
            // Обновляем прогресс из localStorage
            const cachedData = localStorage.getItem('discordProfilesCache');
            if (cachedData) {
                try {
                    const profiles = JSON.parse(cachedData);
                    const progressFill = document.getElementById('cache-progress-fill');
                    const footer = document.getElementById('cache-notification-footer');
                    
                    if (progressFill) {
                        const estimatedTotal = 50;
                        const progress = Math.min((profiles.length / estimatedTotal) * 100, 95);
                        progressFill.style.width = `${progress}%`;
                    }
                    
                    if (footer) {
                        footer.textContent = `Загружено ${profiles.length} профилей...`;
                    }
                } catch (e) {
                    // Ignore
                }
            }
            
            if (this.isDiscordCacheLoaded) {
                const progressFill = document.getElementById('cache-progress-fill');
                const footer = document.getElementById('cache-notification-footer');
                
                if (progressFill) progressFill.style.width = '100%';
                if (footer) footer.textContent = `✓ Загружено ${this.discordProfilesCache.length} профилей`;
                
                // Скрываем через 3 секунды
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(400px)';
                    setTimeout(() => {
                        notification.remove();
                        clearInterval(positionInterval);
                    }, 300);
                }, 3000);
                
                clearInterval(checkInterval);
            }
            
            // Таймаут
            if (checkCount >= maxChecks) {
                const footer = document.getElementById('cache-notification-footer');
                if (footer) footer.textContent = '⚠ Превышено время ожидания';
                
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(400px)';
                    setTimeout(() => {
                        notification.remove();
                        clearInterval(positionInterval);
                    }, 300);
                }, 5000);
                
                clearInterval(checkInterval);
            }
        }, 100);
    }
    
    // Фоновая загрузка Discord профилей
    async loadDiscordProfilesInBackground() {
        const token = localStorage.getItem('fearToken');
        if (!token) {
            return;
        }
        
        // Проверяем, не загружены ли уже профили
        const cachedProfiles = localStorage.getItem('discordProfilesCache');
        const cacheTimestamp = localStorage.getItem('discordProfilesCacheTime');
        
        // Если кэш свежий (меньше 24 часов), используем его
        if (cachedProfiles && cacheTimestamp) {
            const cacheAge = Date.now() - parseInt(cacheTimestamp);
            if (cacheAge < 24 * 60 * 60 * 1000) { // 24 часа
                this.discordProfilesCache = JSON.parse(cachedProfiles);
                this.isDiscordCacheLoaded = true;
                console.log('[Discord Cache] Loaded from localStorage:', this.discordProfilesCache.length, 'profiles');
                console.log('[Discord Cache] Cache age:', Math.round(cacheAge / (60 * 60 * 1000)), 'hours');
                return;
            } else {
                console.log('[Discord Cache] Cache expired (older than 24 hours), reloading...');
            }
        } else {
            console.log('[Discord Cache] No cache found, loading for the first time...');
        }
        
        // Проверяем, не идёт ли уже загрузка в другой вкладке/странице
        const loadingFlag = localStorage.getItem('discordProfilesCacheLoading');
        if (loadingFlag === 'true') {
            console.log('[Discord Cache] Another page is already loading profiles, waiting...');
            // Ждём максимум 30 секунд
            let waitTime = 0;
            const checkInterval = setInterval(() => {
                const stillLoading = localStorage.getItem('discordProfilesCacheLoading');
                const newCache = localStorage.getItem('discordProfilesCache');
                
                if (stillLoading !== 'true' && newCache) {
                    // Загрузка завершена
                    this.discordProfilesCache = JSON.parse(newCache);
                    this.isDiscordCacheLoaded = true;
                    console.log('[Discord Cache] Loaded from another page:', this.discordProfilesCache.length, 'profiles');
                    clearInterval(checkInterval);
                } else if (waitTime >= 30000) {
                    // Таймаут - загружаем сами
                    console.log('[Discord Cache] Wait timeout, loading ourselves...');
                    localStorage.removeItem('discordProfilesCacheLoading');
                    this.loadDiscordProfilesInBackground();
                    clearInterval(checkInterval);
                }
                
                waitTime += 500;
            }, 500);
            return;
        }
        
        try {
            // Устанавливаем флаг загрузки
            localStorage.setItem('discordProfilesCacheLoading', 'true');
            
            console.log('[Discord Cache] Loading admin profiles in background...');
            
            // Получаем список всех админов
            const adminsResponse = await fetch('/api/admins', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!adminsResponse.ok) {
                console.error('[Discord Cache] Failed to fetch admins:', adminsResponse.status);
                localStorage.removeItem('discordProfilesCacheLoading');
                return;
            }
            
            const admins = await adminsResponse.json();
            console.log('[Discord Cache] Total admins:', admins.length);
            
            // Загружаем профили всех админов (по 5 одновременно для ускорения)
            this.discordProfilesCache = [];
            const batchSize = 5;
            const failedAdmins = []; // Список админов, которые не удалось загрузить
            
            for (let i = 0; i < admins.length; i += batchSize) {
                const batch = admins.slice(i, i + batchSize);
                const promises = batch.map((admin, index) => 
                    fetch(`/api/player?steamid=${admin.steamid}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    })
                    .then(res => {
                        if (res.ok) {
                            return res.json();
                        } else {
                            // Сохраняем админа для повторной попытки
                            failedAdmins.push(admin);
                            return null;
                        }
                    })
                    .catch(() => {
                        // Сохраняем админа для повторной попытки
                        failedAdmins.push(admin);
                        return null;
                    })
                );
                
                const profiles = await Promise.all(promises);
                this.discordProfilesCache.push(...profiles.filter(p => p !== null));
                
                console.log(`[Discord Cache] Loaded ${this.discordProfilesCache.length}/${admins.length} profiles...`);
                
                // Сохраняем промежуточный результат в localStorage
                localStorage.setItem('discordProfilesCache', JSON.stringify(this.discordProfilesCache));
            }
            
            // Повторная попытка для неудачных загрузок
            if (failedAdmins.length > 0) {
                console.log(`[Discord Cache] Retrying ${failedAdmins.length} failed profiles...`);
                
                // Ждём 2 секунды перед повторной попыткой
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                for (let i = 0; i < failedAdmins.length; i += batchSize) {
                    const batch = failedAdmins.slice(i, i + batchSize);
                    const promises = batch.map(admin => 
                        fetch(`/api/player?steamid=${admin.steamid}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                            }
                        })
                        .then(res => res.ok ? res.json() : null)
                        .catch(() => null)
                    );
                    
                    const profiles = await Promise.all(promises);
                    const successfulProfiles = profiles.filter(p => p !== null);
                    
                    if (successfulProfiles.length > 0) {
                        this.discordProfilesCache.push(...successfulProfiles);
                        console.log(`[Discord Cache] Retry successful: +${successfulProfiles.length} profiles (${this.discordProfilesCache.length}/${admins.length} total)`);
                        
                        // Сохраняем обновлённый результат
                        localStorage.setItem('discordProfilesCache', JSON.stringify(this.discordProfilesCache));
                    }
                }
                
                const finalFailedCount = admins.length - this.discordProfilesCache.length;
                if (finalFailedCount > 0) {
                    console.warn(`[Discord Cache] ${finalFailedCount} profiles failed to load after retry`);
                }
            }
            
            this.isDiscordCacheLoaded = true;
            
            // Сохраняем финальный результат в localStorage
            localStorage.setItem('discordProfilesCache', JSON.stringify(this.discordProfilesCache));
            localStorage.setItem('discordProfilesCacheTime', Date.now().toString());
            localStorage.removeItem('discordProfilesCacheLoading');
            
            console.log('[Discord Cache] ✓ Finished loading and saved to localStorage:', this.discordProfilesCache.length, 'profiles');
            console.log('[Discord Cache] Cache will be valid for 24 hours');
            
        } catch (error) {
            console.error('[Discord Cache] Error loading profiles:', error);
            localStorage.removeItem('discordProfilesCacheLoading');
        }
    }
    
    // Проверка возраста кэша
    checkCacheAge() {
        const cacheTimestamp = localStorage.getItem('discordProfilesCacheTime');
        
        if (!cacheTimestamp) {
            return;
        }
        
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const hoursOld = Math.round(cacheAge / (60 * 60 * 1000));
        
        console.log(`[Discord Cache] Cache age check: ${hoursOld} hours old`);
        
        // Если кэш старше 24 часов, обновляем
        if (cacheAge >= 24 * 60 * 60 * 1000) {
            console.log('[Discord Cache] Cache is older than 24 hours, refreshing...');
            // Очищаем старый кэш
            localStorage.removeItem('discordProfilesCache');
            localStorage.removeItem('discordProfilesCacheTime');
            // Загружаем заново
            this.loadDiscordProfilesInBackground();
        }
    }
    
    // Получить профили из кэша
    getDiscordProfilesCache() {
        return {
            profiles: this.discordProfilesCache,
            isLoaded: this.isDiscordCacheLoaded
        };
    }
}

// Инициализируем при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.banGoalsNotifier = new BanGoalsNotifier();
        // Показываем виджет через 2 секунды после загрузки
        setTimeout(() => {
            window.banGoalsNotifier.showProgressWidget();
            // Уведомление о загрузке Discord кэша отключено
        }, 2000);
    });
} else {
    window.banGoalsNotifier = new BanGoalsNotifier();
    setTimeout(() => {
        window.banGoalsNotifier.showProgressWidget();
        // Уведомление о загрузке Discord кэша отключено
    }, 2000);
}
