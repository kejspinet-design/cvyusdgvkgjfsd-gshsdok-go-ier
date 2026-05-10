/**
 * ConfigCheckerUMA class for parsing config.vdf and checking Fear + UMA bans
 */
class ConfigCheckerUMA {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.uploadArea = null;
        this.fileInput = null;
        this.resultsColumn = null;
        this.countElement = null;
        this.wsConnection = null; // Persistent WebSocket connection
        this.wsReady = false;
        this.isProcessing = false; // Flag to prevent double processing
        
        this.init();
        this.initWebSocket(); // Connect to yooma.su immediately
    }

    /**
     * Initialize config checker
     */
    init() {
        this.uploadArea = document.getElementById('configUploadAreaUMA');
        this.fileInput = document.getElementById('configFileInputUMA');
        this.resultsColumn = document.getElementById('config-check-column-uma');
        this.countElement = document.getElementById('configCheckCountUMA');
        
        if (!this.uploadArea || !this.fileInput || !this.resultsColumn) {
            console.error('[ConfigCheckerUMA] Required elements not found');
            return;
        }
        
        // Bind events
        this.bindEvents();
        
        console.info('[ConfigCheckerUMA] Initialized');
    }

    /**
     * Initialize WebSocket connection to yooma.su proxy
     * This keeps connection alive for faster checks
     * Only works in local development
     */
    initWebSocket() {
        // Skip WebSocket in production (Vercel or any non-localhost)
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        
        if (!isLocalhost) {
            console.info('[ConfigCheckerUMA] Skipping WebSocket in production environment');
            this.wsReady = false;
            return;
        }
        
        try {
            console.info('[ConfigCheckerUMA] Connecting to yooma.su WebSocket proxy...');
            
            this.wsConnection = new WebSocket('ws://localhost:3003');
            
            this.wsConnection.onopen = () => {
                console.info('[ConfigCheckerUMA] ✅ Connected to yooma.su WebSocket proxy');
                this.wsReady = true;
            };
            
            this.wsConnection.onerror = (error) => {
                console.error('[ConfigCheckerUMA] ❌ WebSocket connection error:', error);
                this.wsReady = false;
            };
            
            this.wsConnection.onclose = () => {
                console.warn('[ConfigCheckerUMA] WebSocket connection closed, reconnecting in 5s...');
                this.wsReady = false;
                
                // Reconnect after 5 seconds (only in development)
                setTimeout(() => {
                    if (!this.wsReady && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                        this.initWebSocket();
                    }
                }, 5000);
            };
            
            this.wsConnection.onmessage = (event) => {
                // Handle initial connection messages
                try {
                    if (event.data instanceof Blob) {
                        event.data.text().then(text => {
                            const data = JSON.parse(text);
                            if (data.type === 'get_type') {
                                console.debug('[ConfigCheckerUMA] WebSocket ready for requests');
                            }
                        });
                    } else {
                        const data = JSON.parse(event.data);
                        if (data.type === 'get_type') {
                            console.debug('[ConfigCheckerUMA] WebSocket ready for requests');
                        }
                    }
                } catch (error) {
                    // Ignore parsing errors for initial messages
                }
            };
            
        } catch (error) {
            console.error('[ConfigCheckerUMA] Failed to initialize WebSocket:', error);
            this.wsReady = false;
        }
    }

    /**
     * Bind drag-and-drop and file input events
     */
    bindEvents() {
        // File input change
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && !this.isProcessing) {
                this.handleFile(file);
            }
            // Clear the input value to allow selecting the same file again
            e.target.value = '';
        });
        
        // Click to open file dialog - DISABLED, using button instead
        /*
        this.uploadArea.addEventListener('click', (e) => {
            // Don't trigger if clicking on the button or label itself
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL' || e.target.closest('button') || e.target.closest('label')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            if (!this.isProcessing) {
                this.fileInput.click();
            }
        });
        */
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.isProcessing) {
                this.uploadArea.classList.add('drag-over');
            }
        });
        
        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadArea.classList.remove('drag-over');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadArea.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file && !this.isProcessing) {
                this.handleFile(file);
            }
        });
    }

    /**
     * Handle uploaded file
     */
    async handleFile(file) {
        // Prevent double processing
        if (this.isProcessing) {
            console.warn('[ConfigCheckerUMA] File processing already in progress, ignoring');
            return;
        }
        
        this.isProcessing = true;
        console.info('[ConfigChecker] File uploaded:', file.name);
        
        // Validate file
        if (!file.name.endsWith('.vdf') && !file.name.endsWith('.cfg')) {
            alert('Пожалуйста, загрузите файл config.vdf или config.cfg');
            this.isProcessing = false;
            return;
        }
        
        // Show processing state
        this.showProcessing();
        
        try {
            // Read file content
            const content = await this.readFile(file);
            
            // Parse Steam IDs from config
            const steamIds = this.parseSteamIds(content);
            
            console.info('[ConfigChecker] Found Steam IDs:', steamIds.length);
            
            if (steamIds.length === 0) {
                alert('В файле не найдено Steam ID');
                this.showUploadArea();
                this.isProcessing = false;
                return;
            }
            
            // Check bans for each Steam ID
            const results = await this.checkBans(steamIds);
            
            // Render results
            this.renderResults(results);
            
        } catch (error) {
            console.error('[ConfigChecker] Error processing file:', error);
            this.showError('Ошибка при обработке файла');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Read file content
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Parse Steam IDs from config.vdf content
     * Looks for patterns like "7656119XXXXXXXXXX"
     */
    parseSteamIds(content) {
        const steamIdPattern = /7656119\d{10}/g;
        const matches = content.match(steamIdPattern);
        
        if (!matches) {
            return [];
        }
        
        // Remove duplicates
        return [...new Set(matches)];
    }

    /**
     * Check bans for Steam IDs using Fear API + UMA API
     */
    async checkBans(steamIds) {
        const results = [];
        
        try {
            // Check Fear API, UMA API and fetch player data for each Steam ID
            for (const steamId of steamIds) {
                try {
                    // Check ban status and fetch player data in parallel
                    const [fearBan, umaBan, playerData] = await Promise.all([
                        this.checkFearBan(steamId),
                        this.checkUMABan(steamId),
                        this.fetchPlayerData(steamId)
                    ]);
                    
                    results.push({
                        steamId: steamId,
                        fearBanned: fearBan.banned,
                        fearReason: fearBan.reason,
                        umaBanned: umaBan.banned,
                        umaReason: umaBan.reason,
                        isBanned: fearBan.banned || umaBan.banned,
                        nickname: playerData.nickname,
                        avatar: playerData.avatar
                    });
                    
                } catch (error) {
                    console.error(`[ConfigCheckerUMA] Error checking ${steamId}:`, error);
                    results.push({
                        steamId: steamId,
                        fearBanned: false,
                        fearReason: 'Ошибка проверки',
                        umaBanned: false,
                        umaReason: 'Ошибка проверки',
                        isBanned: false,
                        nickname: null,
                        avatar: null
                    });
                }
            }
            
            return results;
            
        } catch (error) {
            console.error('[ConfigCheckerUMA] Critical error during check:', error);
            throw error;
        }
    }

    /**
     * Check UMA.SU ban status via WebSocket proxy
     */
    async checkUMABan(steamId) {
        return new Promise((resolve) => {
            // Check if we're in production
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '';
            
            // In production, use API endpoint
            if (!isLocalhost) {
                console.info('[ConfigCheckerUMA] Using UMA API endpoint');
                fetch(`/api/uma?steamid=${steamId}`)
                    .then(response => response.json())
                    .then(data => {
                        resolve(data);
                    })
                    .catch(error => {
                        console.error('[ConfigCheckerUMA] UMA API error:', error);
                        resolve({ banned: false, reason: 'Ошибка API' });
                    });
                return;
            }
            
            // In development, use local WebSocket proxy
            try {
                // Connect to local WebSocket proxy instead of yooma.su directly
                const ws = new WebSocket('ws://localhost:3003');
                
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve({ banned: false, reason: 'Таймаут' });
                }, 10000);
                
                let requestSent = false;
                
                ws.onopen = () => {
                    console.info('[ConfigCheckerUMA] Connected to WebSocket proxy for', steamId);
                };
                
                ws.onmessage = (event) => {
                    try {
                        // Handle Blob data
                        if (event.data instanceof Blob) {
                            event.data.text().then(text => {
                                const data = JSON.parse(text);
                                this.handleUMAMessage(data, ws, steamId, timeout, resolve, requestSent, (sent) => { requestSent = sent; });
                            }).catch(error => {
                                console.error('[ConfigCheckerUMA] Error reading Blob:', error);
                                clearTimeout(timeout);
                                resolve({ banned: false, reason: 'Ошибка парсинга' });
                                ws.close();
                            });
                        } else {
                            // Handle text data
                            const data = JSON.parse(event.data);
                            this.handleUMAMessage(data, ws, steamId, timeout, resolve, requestSent, (sent) => { requestSent = sent; });
                        }
                    } catch (error) {
                        console.error('[ConfigCheckerUMA] Error parsing response:', error);
                        clearTimeout(timeout);
                        resolve({ banned: false, reason: 'Ошибка парсинга' });
                        ws.close();
                    }
                };
                
                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('[ConfigCheckerUMA] WebSocket error:', error);
                    resolve({ banned: false, reason: 'Ошибка соединения' });
                    ws.close();
                };
                
                ws.onclose = () => {
                    clearTimeout(timeout);
                };
                
            } catch (error) {
                console.warn('[ConfigCheckerUMA] Check failed:', error);
                resolve({ banned: false, reason: 'Ошибка проверки' });
            }
        });
    }

    /**
     * Handle WebSocket message from yooma.su
     */
    handleUMAMessage(data, ws, steamId, timeout, resolve, requestSent, setRequestSent) {
        try {
            console.debug('[ConfigCheckerUMA] Received message type:', data.type, 'for', steamId);
            
            // Server sends get_type first - respond with our request
            if (data.type === 'get_type' && !requestSent) {
                setRequestSent(true);
                
                const request = {
                    type: 'get_punishments',
                    page: 1,
                    punish_type: 0, // All punishment types
                    search: steamId
                };
                
                console.debug('[ConfigCheckerUMA] Sending request:', request);
                ws.send(JSON.stringify(request));
                return;
            }
            
            // Ignore page count response
            if (data.type === 'get_punishments_pages') {
                console.debug('[ConfigCheckerUMA] Ignoring punishments_pages response');
                return;
            }
            
            // Check punishments response
            if (data.type === 'get_punishments' && data.punishments) {
                clearTimeout(timeout);
                
                console.debug('[ConfigCheckerUMA] Received punishments:', data.punishments.length, 'for', steamId);
                
                if (Array.isArray(data.punishments) && data.punishments.length > 0) {
                    // Check each punishment for active bans
                    for (const punishment of data.punishments) {
                        const expires = punishment.expires;
                        const now = Math.floor(Date.now() / 1000);
                        const reason = punishment.reason || 'Забанен';
                        
                        console.debug('[ConfigCheckerUMA] Checking punishment:', {
                            steamId,
                            reason,
                            expires,
                            now,
                            isActive: expires > now
                        });
                        
                        // Check if ban is active
                        if (expires > now) {
                            console.info('[ConfigCheckerUMA] Active ban found for', steamId, ':', reason);
                            resolve({
                                banned: true,
                                reason: reason
                            });
                            ws.close();
                            return;
                        }
                    }
                    
                    // No active bans found
                    console.debug('[ConfigCheckerUMA] No active bans for', steamId);
                    resolve({ banned: false, reason: 'Не забанен' });
                } else {
                    console.debug('[ConfigCheckerUMA] No punishments for', steamId);
                    resolve({ banned: false, reason: 'Не забанен' });
                }
                
                ws.close();
            }
        } catch (error) {
            console.error('[ConfigCheckerUMA] Error in handleUMAMessage:', error);
            clearTimeout(timeout);
            resolve({ banned: false, reason: 'Ошибка обработки' });
            ws.close();
        }
    }

    /**
     * Check Fear ban status using old API method
     */
    async checkFearBan(steamId) {
        try {
            console.log('[ConfigCheckerUMA] Checking Fear API for:', steamId);
            
            // Use old API method with punishments search
            const apiUrl = `/api/fear?q=${encodeURIComponent(steamId)}&page=1&limit=10&type=1`;
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn(`[ConfigCheckerUMA] Fear API returned ${response.status} for ${steamId}`);
                return { banned: false, reason: 'Не забанен' };
            }
            
            const data = await response.json();
            console.log('[ConfigCheckerUMA] Fear API response for', steamId, ':', data);
            
            // Check if any active bans found
            if (data && data.punishments && Array.isArray(data.punishments) && data.punishments.length > 0) {
                // Find ban where steamid matches the searched player (not admin)
                const playerBan = data.punishments.find(ban => ban.steamid === steamId);
                
                if (playerBan) {
                    const status = playerBan.status; // 1 = active, 0 = expired
                    
                    if (status === 1) {
                        // Hide admin information - don't include admin, admin_steamid, admin_avatar fields
                        return {
                            banned: true,
                            reason: playerBan.reason || 'Забанен'
                        };
                    } else {
                        return {
                            banned: false,
                            reason: 'Бан истек'
                        };
                    }
                } else {
                    return { banned: false, reason: 'Не забанен' };
                }
            } else {
                return { banned: false, reason: 'Не забанен' };
            }
            
        } catch (error) {
            console.warn('[ConfigCheckerUMA] Fear API check failed:', error);
            return { banned: false, reason: 'Ошибка проверки' };
        }
    }

    /**
     * Fetch player data (nickname and avatar) from Fear API
     */
    async fetchPlayerData(steamId) {
        try {
            // Use proxy endpoint for player data
            const apiUrl = `/api/player?steamid=${steamId}&mode=public`;
            
            console.log(`[ConfigChecker] Fetching player data for ${steamId}`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn(`[ConfigChecker] Player API returned ${response.status} for ${steamId}`);
                return { 
                    nickname: null, 
                    avatar: null,
                    steamId: steamId
                };
            }
            
            const data = await response.json();
            console.log(`[ConfigChecker] Player data for ${steamId}:`, {
                hasName: !!data.name,
                hasAvatarFull: !!data.avatar_full,
                hasAvatar: !!data.avatar,
                hasAvatarMedium: !!data.avatar_medium
            });
            
            // Extract nickname and avatar from response (new format from /profile/{steamid})
            const nickname = (data.name && data.name !== 'undefined') ? data.name : null;
            
            // Try multiple avatar sources with priority
            const avatar = data.avatar_full || data.avatar_medium || data.avatar || null;
            
            // If no avatar from API, generate a fallback based on Steam ID
            let finalAvatar = avatar;
            if (!finalAvatar) {
                // Generate a deterministic color based on Steam ID
                const colors = [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                    '#fa709a', '#fee140', '#a8edea', '#fed6e3'
                ];
                const colorIndex = parseInt(steamId.slice(-2)) % colors.length;
                const color = colors[colorIndex];
                
                // Create SVG placeholder avatar
                finalAvatar = `data:image/svg+xml;base64,${btoa(`
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="32" cy="32" r="32" fill="${color}"/>
                        <text x="32" y="38" text-anchor="middle" fill="white" font-family="Poppins, sans-serif" font-size="24">👤</text>
                    </svg>
                `)}`;
            }
            
            return { 
                nickname, 
                avatar: finalAvatar,
                steamId: steamId,
                hasRealAvatar: !!avatar // Track if we have real avatar or placeholder
            };
        } catch (error) {
            console.warn(`[ConfigChecker] Player data fetch failed for ${steamId}:`, error);
            return { 
                nickname: null, 
                avatar: null,
                steamId: steamId,
                hasRealAvatar: false
            };
        }
    }

    /**
     * Show processing state
     */
    showProcessing() {
        this.uploadArea.style.display = 'none';
        this.resultsColumn.style.display = 'flex';
        this.resultsColumn.innerHTML = `
            <div class="config-processing">
                <div class="processing-spinner"></div>
                <p class="processing-text">Обработка файла...</p>
                <p class="processing-subtext">Проверяем игроков на баны</p>
            </div>
        `;
    }

    /**
     * Show upload area
     */
    showUploadArea() {
        this.uploadArea.style.display = 'flex';
        this.resultsColumn.style.display = 'none';
        this.resultsColumn.innerHTML = '';
        this.updateCount(0);
        this.isProcessing = false; // Reset processing flag
    }

    /**
     * Render check results
     */
    renderResults(results) {
        this.resultsColumn.innerHTML = '';
        this.resultsColumn.style.display = 'flex';
        this.uploadArea.style.display = 'none';
        
        // Count banned players
        const bannedCount = results.filter(r => r.isBanned).length;
        this.updateCount(bannedCount);
        
        // Sort: banned first
        results.sort((a, b) => {
            if (a.isBanned && !b.isBanned) return -1;
            if (!a.isBanned && b.isBanned) return 1;
            return 0;
        });
        
        // Render each result
        results.forEach(result => {
            const card = this.createResultCard(result);
            this.resultsColumn.appendChild(card);
        });
        
        // Add reset button
        const resetButton = document.createElement('button');
        resetButton.className = 'upload-button';
        resetButton.textContent = 'Проверить другой файл';
        resetButton.style.marginTop = '20px';
        resetButton.style.marginBottom = '20px';
        resetButton.style.alignSelf = 'center';
        resetButton.style.width = 'auto';
        resetButton.style.maxWidth = '300px';
        resetButton.style.padding = '12px 30px';
        resetButton.onclick = () => this.showUploadArea();
        
        this.resultsColumn.appendChild(resetButton);
    }

    /**
     * Create result card element with avatar, nickname, and action buttons
     */
    createResultCard(result) {
        const card = document.createElement('div');
        card.className = `ban-status-card ${result.isBanned ? 'banned' : 'clean'}`;
        
        // Build avatar HTML with better error handling
        let avatarHtml;
        if (result.avatar) {
            // Check if avatar is a data URL (placeholder) or real URL
            const isDataUrl = result.avatar.startsWith('data:');
            avatarHtml = `<img src="${result.avatar}" alt="Avatar" class="player-avatar" 
                onerror="if (!this.hasError) { this.hasError = true; this.style.display='none'; 
                const placeholder = document.createElement('div'); 
                placeholder.className='player-avatar-placeholder'; 
                placeholder.textContent='👤';
                this.parentNode.insertBefore(placeholder, this); }">`;
            
            // Add data-url class for styling if needed
            if (isDataUrl) {
                avatarHtml = avatarHtml.replace('class="player-avatar"', 'class="player-avatar avatar-placeholder"');
            }
        } else {
            avatarHtml = '<div class="player-avatar-placeholder">👤</div>';
        }
        
        // Build nickname HTML if available
        const nicknameHtml = result.nickname 
            ? `<span class="player-nickname">${this.escapeHtml(result.nickname)}</span>`
            : `<span class="player-nickname missing">Steam ID: ${result.steamId.substring(0, 8)}...</span>`;
        
        card.innerHTML = `
            <div class="ban-status-header">
                <div class="player-info">
                    ${avatarHtml}
                    <div class="player-details">
                        ${nicknameHtml}
                        <span class="ban-status-steamid">${result.steamId}</span>
                    </div>
                </div>
                <span class="ban-status-badge ${result.isBanned ? 'banned' : 'clean'}">
                    ${result.isBanned ? '🚫 Забанен' : '✅ Чист'}
                </span>
            </div>
            <div class="ban-status-details">
                <div class="ban-detail-row">
                    <span class="ban-detail-label">Fear:</span>
                    <span class="ban-detail-value ${result.fearBanned ? 'banned' : 'clean'}">
                        ${result.fearBanned ? '❌ ' + result.fearReason : '✅ Не забанен'}
                    </span>
                </div>
                <div class="ban-detail-row">
                    <span class="ban-detail-label">yooma.su:</span>
                    <span class="ban-detail-value ${result.umaBanned ? 'banned' : 'clean'}">
                        ${result.umaBanned ? '❌ ' + result.umaReason : '✅ Не забанен'}
                    </span>
                </div>
            </div>
            <div class="card-actions">
                <a href="https://fearproject.ru/profile/${result.steamId}" target="_blank" class="action-btn action-btn-profile">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Профиль Fear
                </a>
                <button class="action-btn action-btn-copy" onclick="window.copyToClipboard('${result.steamId}', this)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Скопировать ID
                </button>
            </div>
        `;
        
        return card;
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
     * Update count badge
     */
    updateCount(count) {
        if (this.countElement) {
            this.countElement.textContent = count;
        }
    }

    /**
     * Show error message with Discord support link (MODAL)
     */
    showError(message) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.3s;';
        
        // Create modal content
        modal.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
            <div style="background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%); color: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); max-width: 600px; width: 90%; animation: slideIn 0.3s;">
                <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                <h2 style="margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">${message}</h2>
                <p style="margin: 20px 0; font-size: 18px; line-height: 1.8; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 10px;">
                    Извините, у нас ошибка!<br>
                    Откройте консоль (<strong>F12</strong>), заскриньте ошибки<br>
                    и отправьте нашему разработчику в Discord сервер.
                </p>
                <a href="https://discord.gg/QcBKPYUFYS" target="_blank" style="display: inline-block; background: white; color: #ff4757; padding: 18px 50px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 20px; margin: 10px; transition: all 0.3s; box-shadow: 0 6px 15px rgba(0,0,0,0.3);" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 6px 15px rgba(0,0,0,0.3)'">
                    🎮 Открыть Discord
                </a>
                <button onclick="this.closest('div[style*=fixed]').remove(); location.reload()" style="display: block; width: 100%; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 15px; border-radius: 12px; font-size: 18px; font-weight: bold; margin-top: 20px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    🔄 Перезагрузить страницу
                </button>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='rotate(90deg)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='rotate(0deg)'">
                    ×
                </button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
}