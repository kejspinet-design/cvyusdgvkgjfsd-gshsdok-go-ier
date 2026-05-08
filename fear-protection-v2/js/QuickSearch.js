/**
 * QuickSearch class for checking single Steam ID bans
 */
class QuickSearch {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.searchInput = null;
        this.searchButton = null;
        this.resultContainer = null;
        
        this.init();
    }

    /**
     * Initialize quick search
     */
    init() {
        this.searchInput = document.getElementById('quickSearchInput');
        this.searchButton = document.getElementById('quickSearchButton');
        this.resultContainer = document.getElementById('quickSearchResult');
        
        if (!this.searchInput || !this.searchButton || !this.resultContainer) {
            console.error('[QuickSearch] Required elements not found');
            return;
        }
        
        // Bind events
        this.bindEvents();
        
        console.info('[QuickSearch] Initialized');
    }

    /**
     * Bind search events
     */
    bindEvents() {
        // Search button click
        this.searchButton.addEventListener('click', () => {
            this.handleSearch();
        });
        
        // Enter key in input
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
    }

    /**
     * Handle search action
     */
    async handleSearch() {
        const steamId = this.searchInput.value.trim();
        
        // Validate Steam ID format (17 digits starting with 7656119)
        if (!this.validateSteamId(steamId)) {
            this.showError('Неверный формат Steam ID. Введите 17-значный Steam ID (например: 76561199881908264)');
            return;
        }
        
        console.info('[QuickSearch] Searching for:', steamId);
        
        // Show loading state
        this.showLoading();
        
        try {
            // Check Fear only
            const fearResult = await this.checkFearBan(steamId);
            
            // Render results
            this.renderResults(steamId, fearResult);
            
        } catch (error) {
            console.error('[QuickSearch] Search error:', error);
            this.showError('Ошибка при проверке. Попробуйте снова.');
        }
    }

    /**
     * Validate Steam ID format
     */
    validateSteamId(steamId) {
        // Must be 17 digits starting with 7656119
        const pattern = /^7656119\d{10}$/;
        return pattern.test(steamId);
    }

    /**
     * Check Fear ban status
     */
    async checkFearBan(steamId) {
        try {
            console.log('[QuickSearch] Checking Fear API for:', steamId);
            
            // Use proxy endpoint with correct path
            // Use Vercel serverless function
            const apiUrl = `/api/fear?q=${encodeURIComponent(steamId)}&page=1&limit=10&type=1`;
            
            console.log('[QuickSearch] Requesting:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('[QuickSearch] Fear API error:', response.status, response.statusText);
                return { 
                    banned: false, 
                    reason: `Ошибка API (${response.status})`, 
                    error: true 
                };
            }
            
            const data = await response.json();
            console.log('[QuickSearch] Fear API response:', data);
            
            // Check if any active bans found
            if (data && data.punishments && Array.isArray(data.punishments) && data.punishments.length > 0) {
                const ban = data.punishments[0];
                const status = ban.status; // 1 = active, 0 = expired
                
                // Extract player data from ban (nickname and avatar)
                const nickname = (ban.name && ban.name !== 'undefined') ? ban.name : null;
                const avatar = ban.avatar || null;
                
                if (status === 1) {
                    return {
                        banned: true,
                        reason: ban.reason || 'Забанен',
                        error: false,
                        nickname: nickname,
                        avatar: avatar
                    };
                } else {
                    return {
                        banned: false,
                        reason: 'Бан истек',
                        error: false,
                        nickname: nickname,
                        avatar: avatar
                    };
                }
            } else {
                return { banned: false, reason: 'Не забанен', error: false };
            }
            
        } catch (error) {
            console.error('[QuickSearch] Fear API error:', error);
            return { banned: false, reason: 'Ошибка проверки', error: true };
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.resultContainer.style.display = 'block';
        this.resultContainer.innerHTML = `
            <div class="quick-search-loading">
                <div class="processing-spinner"></div>
                <p>Проверяем игрока...</p>
            </div>
        `;
        
        // Disable button
        this.searchButton.disabled = true;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.resultContainer.style.display = 'block';
        this.resultContainer.innerHTML = `
            <div class="quick-search-card" style="border-left-color: #ff4757;">
                <p style="color: #ff4757; text-align: center; margin: 0;">❌ ${message}</p>
            </div>
        `;
        
        // Re-enable button
        this.searchButton.disabled = false;
    }

    /**
     * Render search results with avatar and nickname from Fear API
     */
    renderResults(steamId, fearResult) {
        // Determine overall status
        const isBanned = fearResult.banned;
        
        // Build avatar HTML if available
        const avatarHtml = fearResult.avatar 
            ? `<img src="${fearResult.avatar}" alt="Avatar" class="player-avatar" onerror="this.style.display='none'">`
            : '';
        
        // Build nickname HTML if available
        const nicknameHtml = fearResult.nickname 
            ? `<span class="player-nickname">${this.escapeHtml(fearResult.nickname)}</span>`
            : '';
        
        this.resultContainer.style.display = 'block';
        this.resultContainer.innerHTML = `
            <div class="quick-search-card ${isBanned ? 'banned' : 'clean'}">
                <div class="quick-search-header">
                    <div class="player-info">
                        ${avatarHtml}
                        <div class="player-details">
                            ${nicknameHtml}
                            <span class="quick-search-steamid">${steamId}</span>
                        </div>
                    </div>
                    <span class="quick-search-status ${isBanned ? 'banned' : 'clean'}">
                        ${isBanned ? '🚫 Забанен' : '✅ Чист'}
                    </span>
                </div>
                <div class="quick-search-details">
                    <div class="quick-search-detail-item">
                        <div class="quick-search-detail-label">Fear Project</div>
                        <div class="quick-search-detail-value ${fearResult.banned ? 'banned' : 'clean'}">
                            ${fearResult.banned ? '❌ ' + fearResult.reason : '✅ ' + fearResult.reason}
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <a href="https://fearproject.ru/profile/${steamId}" target="_blank" class="action-btn action-btn-profile">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Профиль Fear
                    </a>
                    <button class="action-btn action-btn-copy" onclick="window.copyToClipboard('${steamId}', this)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Скопировать ID
                    </button>
                </div>
            </div>
        `;
        
        // Re-enable button
        this.searchButton.disabled = false;
        
        console.info('[QuickSearch] Results rendered');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
