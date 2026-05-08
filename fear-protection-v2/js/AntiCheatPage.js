/**
 * AntiCheatPage class for displaying online players
 * Uses logic from main site (App.js) with new card design
 */
class AntiCheatPage {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.playersList = null;
        this.players = [];
        this.refreshInterval = null;
        this.isFirstLoad = true; // Track first load
        
        this.init();
    }

    /**
     * Initialize anti-cheat page
     */
    init() {
        this.playersList = document.getElementById('anticheat-players-list');
        
        if (!this.playersList) {
            console.error('[AntiCheatPage] Players list element not found');
            return;
        }
        
        // Load players immediately
        this.loadPlayers();
        
        // Auto-refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadPlayers();
        }, 30000);
        
        // Update time display every second
        this.timeUpdateInterval = setInterval(() => {
            this.updateTimeDisplays();
        }, 1000);
        
        console.info('[AntiCheatPage] Initialized');
    }

    /**
     * Load players from servers (using main site logic)
     */
    async loadPlayers() {
        try {
            console.info('[AntiCheatPage] Loading players...');
            
            // Show loading state only on first load
            if (this.isFirstLoad) {
                this.showLoading();
            }
            
            // Fetch servers through local proxy (avoid CORS)
            const response = await fetch('/api/fear?action=servers');
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            
            const serversData = await response.json();
            
            // Handle different API response structures
            let servers = [];
            if (Array.isArray(serversData)) {
                servers = serversData;
            } else if (serversData && serversData.servers) {
                servers = serversData.servers;
            } else if (serversData && serversData.data) {
                servers = serversData.data;
            }
            
            if (!servers || servers.length === 0) {
                this.showEmpty('Нет доступных серверов');
                return;
            }
            
            console.info(`[AntiCheatPage] Found ${servers.length} servers`);
            
            // Extract all Steam IDs from server player lists
            const steamIds = new Set();
            const playerServerMap = new Map(); // Map player to server info
            
            servers.forEach(server => {
                // Real API structure: server.live_data.players
                const liveData = server.live_data || {};
                const playersList = liveData.players || [];
                
                if (Array.isArray(playersList)) {
                    playersList.forEach(player => {
                        const steamId = player.steam_id;
                        if (steamId) {
                            steamIds.add(steamId);
                            // Store player with server info
                            playerServerMap.set(steamId, {
                                player: player,
                                server: server
                            });
                        }
                    });
                }
            });
            
            const steamIdsArray = Array.from(steamIds);
            
            if (steamIdsArray.length === 0) {
                this.showEmpty('Нет игроков онлайн');
                return;
            }
            
            console.info(`[AntiCheatPage] Found ${steamIdsArray.length} players online`);
            
            // Fetch Steam player summaries to get timecreated
            const playerSummaries = await this.apiClient.fetchPlayerSummaries(steamIdsArray);
            
            console.info(`[AntiCheatPage] Fetched ${playerSummaries.length} player summaries`);
            
            // Merge player data with server info and filter by timecreated
            const playersWithServerInfo = [];
            
            playerServerMap.forEach((data, steamId) => {
                const steamProfile = playerSummaries.find(p => p.steamid === steamId);
                
                // Only include players with timecreated (public profiles)
                if (steamProfile && steamProfile.timecreated) {
                    playersWithServerInfo.push({
                        player: data.player,
                        server: data.server,
                        steamProfile: steamProfile,
                        timecreated: steamProfile.timecreated
                    });
                }
            });
            
            if (playersWithServerInfo.length === 0) {
                this.showEmpty('Нет игроков с публичными профилями');
                return;
            }
            
            console.info(`[AntiCheatPage] Found ${playersWithServerInfo.length} players with public profiles`);
            
            // Sort by timecreated (newest accounts first)
            playersWithServerInfo.sort((a, b) => b.timecreated - a.timecreated);
            
            // Take top 10 newest accounts
            this.players = playersWithServerInfo.slice(0, 10);
            
            console.info(`[AntiCheatPage] Showing top 10 newest accounts`);
            
            this.renderPlayers();
            
            // Mark first load as complete
            this.isFirstLoad = false;
            
        } catch (error) {
            console.error('[AntiCheatPage] Error loading players:', error);
            this.showError('Ошибка загрузки данных');
        }
    }

    /**
     * Render players list (smart update - add new, remove offline)
     */
    renderPlayers() {
        // Clear only if it's the first load or if we have loading/error state
        const hasLoadingOrError = this.playersList.querySelector('.config-processing, .empty-state, [style*="position: fixed"]');
        if (hasLoadingOrError || this.isFirstLoad) {
            this.playersList.innerHTML = '';
        }
        
        // Get current Steam IDs from new data
        const newSteamIds = new Set();
        this.players.forEach(playerData => {
            const steamId = playerData.player?.steam_id || playerData.steamProfile?.steamid;
            if (steamId) {
                newSteamIds.add(steamId);
            }
        });
        
        // Remove players who are no longer in the list (went offline)
        const existingCards = this.playersList.querySelectorAll('.player-card');
        existingCards.forEach(card => {
            const steamIdElement = card.querySelector('.player-steamid');
            if (steamIdElement) {
                const steamId = steamIdElement.textContent.trim();
                if (!newSteamIds.has(steamId)) {
                    // Player went offline - remove card immediately
                    card.remove();
                }
            }
        });
        
        // Get existing Steam IDs to avoid duplicates
        const existingSteamIds = new Set();
        this.playersList.querySelectorAll('.player-steamid').forEach(el => {
            existingSteamIds.add(el.textContent.trim());
        });
        
        // Add only new players (who just came online)
        this.players.forEach(playerData => {
            const steamId = playerData.player?.steam_id || playerData.steamProfile?.steamid;
            if (steamId && !existingSteamIds.has(steamId)) {
                const card = this.createPlayerCard(playerData);
                // Add immediately without animation
                this.playersList.appendChild(card);
            }
        });
    }

    /**
     * Create player card with new design (from screenshot)
     */
    createPlayerCard(playerData) {
        const card = document.createElement('div');
        card.className = 'player-card';
        
        // Extract data (same structure as main site)
        const player = playerData.player || {};
        const server = playerData.server || {};
        const steamProfile = playerData.steamProfile || null;
        
        // Use avatar and nickname from Fear API or Steam
        const defaultAvatar = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
        const avatarUrl = player.avatar || steamProfile?.avatarfull || steamProfile?.avatarmedium || defaultAvatar;
        const displayName = player.nickname || steamProfile?.personaname || 'Unknown Player';
        const steamId = player.steam_id || 'N/A';
        
        // Calculate account age
        const timecreated = playerData.timecreated || steamProfile?.timecreated;
        const accountAge = this.calculateAccountAge(timecreated);
        
        // Server info
        const serverName = server.site_name || server.name || 'Неизвестный сервер';
        const serverIp = server.ip || 'N/A';
        const serverPort = server.port || '';
        const serverConnect = serverPort ? `${serverIp}:${serverPort}` : serverIp;
        
        // Stats
        const kills = player.kills || 0;
        const deaths = player.deaths || 0;
        const ping = player.ping || 0;
        
        card.innerHTML = `
            <div class="player-header">
                <img src="${avatarUrl}" alt="Avatar" class="player-avatar-large" onerror="this.src='${defaultAvatar}'">
                <div class="player-info-header">
                    <div class="player-name">${this.escapeHtml(displayName)}</div>
                    <div class="player-steamid">${steamId}</div>
                    <div class="age-text" data-timecreated="${timecreated}" style="font-size: 11px; color: white; margin-top: 5px; border: 1px solid ${accountAge.isNew ? '#ff4444' : '#44ff44'}; padding: 2px 6px; border-radius: 4px; display: inline-block;">${accountAge.text}</div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-label">Убийства</div>
                    <div class="stat-value kills">${kills}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Смерти</div>
                    <div class="stat-value deaths">${deaths}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Пинг</div>
                    <div class="stat-value ping">${ping}ms</div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="action-btn-large" onclick="window.open('https://steamcommunity.com/profiles/${steamId}', '_blank')">
                    STEAM
                </button>
                <button class="action-btn-large" onclick="window.open('https://fearproject.ru/profile/${steamId}', '_blank')">
                    FEAR
                </button>
            </div>
            
            <button class="copy-btn" style="width: 100%; margin-bottom: 10px;" onclick="window.copyToClipboard('${steamId}', this)">
                📋 STEAMID
            </button>
            
            <button class="connect-btn" onclick="window.location.href='steam://connect/${serverConnect}'">
                ▶ ПОДКЛЮЧИТЬСЯ
            </button>
        `;
        
        return card;
    }

    /**
     * Calculate account age with precise time (days, hours, minutes, seconds)
     */
    calculateAccountAge(timestamp) {
        if (!timestamp) {
            return {
                text: 'Неизвестно',
                date: 'Дата создания неизвестна',
                isNew: false
            };
        }
        
        const now = Math.floor(Date.now() / 1000);
        const ageSeconds = now - timestamp;
        
        // Calculate time components
        const days = Math.floor(ageSeconds / 86400);
        const hours = Math.floor((ageSeconds % 86400) / 3600);
        const minutes = Math.floor((ageSeconds % 3600) / 60);
        const seconds = Math.floor(ageSeconds % 60);
        
        // Account is "new" if less than 30 days old
        const isNew = days < 30;
        
        // Format time text with all components
        let timeText = '';
        if (days > 0) {
            timeText += `${days} ${this.pluralize(days, 'день', 'дня', 'дней')} `;
        }
        if (hours > 0 || days > 0) {
            timeText += `${hours} ${this.pluralize(hours, 'час', 'часа', 'часов')} `;
        }
        if (minutes > 0 || hours > 0 || days > 0) {
            timeText += `${minutes} ${this.pluralize(minutes, 'минута', 'минуты', 'минут')} `;
        }
        timeText += `${seconds} ${this.pluralize(seconds, 'секунда', 'секунды', 'секунд')} назад`;
        
        // Format date
        const date = new Date(timestamp * 1000);
        const dateText = `Создан: ${date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        
        return {
            text: timeText.trim(),
            date: dateText,
            isNew: isNew
        };
    }

    /**
     * Update time displays in real-time (every second)
     */
    updateTimeDisplays() {
        const ageTextElements = document.querySelectorAll('.age-text[data-timecreated]');
        
        ageTextElements.forEach(element => {
            const timecreated = parseInt(element.getAttribute('data-timecreated'));
            if (timecreated) {
                const accountAge = this.calculateAccountAge(timecreated);
                element.textContent = accountAge.text;
            }
        });
    }

    /**
     * Pluralize Russian words
     */
    pluralize(number, one, two, five) {
        let n = Math.abs(number);
        n %= 100;
        if (n >= 5 && n <= 20) {
            return five;
        }
        n %= 10;
        if (n === 1) {
            return one;
        }
        if (n >= 2 && n <= 4) {
            return two;
        }
        return five;
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.playersList.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 1000;">
                <div style="width: 60px; height: 60px; margin: 0 auto 20px; border: 4px solid rgba(102, 126, 234, 0.3); border-radius: 50%; border-top-color: #667eea; animation: spin 1s linear infinite;"></div>
                <p style="color: rgba(255, 255, 255, 0.7); font-size: 18px;">Загрузка игроков...</p>
            </div>
        `;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.playersList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <p style="color: white; font-size: 24px; margin-bottom: 10px;">Ошибка</p>
                <p style="color: rgba(255, 255, 255, 0.7); font-size: 18px;">${message}</p>
            </div>
        `;
    }

    /**
     * Show empty state
     */
    showEmpty(message) {
        this.playersList.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 1000;">
                <div style="font-size: 80px; margin-bottom: 20px; animation: float 3s ease-in-out infinite;">😴</div>
                <p style="color: white; font-size: 28px; font-weight: 700; margin-bottom: 10px;">Пусто</p>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 16px;">${message}</p>
            </div>
            <style>
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            </style>
        `;
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

    /**
     * Cleanup
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
        }
    }
}
