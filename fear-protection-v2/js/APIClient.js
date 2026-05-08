/**
 * APIClient class for handling all external API communication
 * Validates: Requirements 2.1-2.8, 10.1-10.5, 11.1-11.5
 */
class APIClient {
    constructor(config) {
        // Auto-detect environment (local vs production)
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        const baseUrl = window.location.origin;
        
        this.config = {
            fearApiBase: config.fearApiBase || `${baseUrl}/api/fear`,
            steamApiKey: config.steamApiKey || 'E060AF2E30A53F487CD115E1067F9983',
            steamApiBase: config.steamApiBase || `${baseUrl}/api/player-summaries`,
            accessToken: config.accessToken,
            cookieDomain: config.cookieDomain || '.fearproject.ru'
        };
        
        console.info('[APIClient] Environment:', isProduction ? 'Production' : 'Local');
        console.info('[APIClient] Fear API:', this.config.fearApiBase);
        console.info('[APIClient] Steam API:', this.config.steamApiBase);
        
        // Set access token cookie on initialization
        this.setCookie('access_token', this.config.accessToken, {
            domain: this.config.cookieDomain,
            path: '/',
            sameSite: 'Lax'
        });
    }

    /**
     * Set a cookie with specified options
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {Object} options - Cookie options (domain, path, sameSite, expires)
     * 
     * Validates: Requirements 2.4, 2.5, 11.1-11.5
     */
    setCookie(name, value, options = {}) {
        let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        
        if (options.domain) {
            cookieString += `; domain=${options.domain}`;
        }
        
        if (options.path) {
            cookieString += `; path=${options.path}`;
        }
        
        if (options.sameSite) {
            cookieString += `; SameSite=${options.sameSite}`;
        }
        
        if (options.expires) {
            cookieString += `; expires=${options.expires.toUTCString()}`;
        }
        
        document.cookie = cookieString;
        console.info('[APIClient] Cookie set:', name);
    }

    /**
     * Fetch server list from Fear Project API
     * @returns {Promise<Array>} Array of server objects
     * 
     * Validates: Requirements 2.1, 10.1, 10.3
     */
    async fetchServers() {
        try {
            const response = await fetch(`${this.config.fearApiBase}/servers/`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.info('[APIClient] Servers fetched:', data.length || 0);
            return data;
        } catch (error) {
            console.error('[APIClient] CORS or Network error fetching servers:', error);
            return this.handleError(error, 'fetchServers');
        }
    }

    /**
     * Fetch recent reports from Fear Project API
     * @returns {Promise<Array>} Array of report objects matching Report interface
     * 
     * Report interface:
     * {
     *   id: string,
     *   reportedSteamId: string,
     *   reporterSteamId: string,
     *   reason: string,
     *   timestamp: Date,
     *   serverId: string
     * }
     * 
     * Validates: Requirements 2.2, 10.1, 10.3
     */
    async fetchReports() {
        try {
            console.info('[APIClient] Fetching reports from /reports/recent...');
            
            const response = await fetch(`${this.config.fearApiBase}/reports/recent`, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.accessToken}`
                }
            });
            
            console.info(`[APIClient] Reports response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                // Log response body for debugging
                const errorText = await response.text();
                console.warn(`[APIClient] Reports endpoint error (${response.status}):`, errorText);
                
                if (response.status === 401) {
                    console.error('[APIClient] Unauthorized - check access token');
                } else if (response.status === 404) {
                    console.error('[APIClient] Endpoint not found - verify API path');
                }
                
                return [];
            }
            
            const data = await response.json();
            console.info('[APIClient] Reports fetched successfully:', Array.isArray(data) ? data.length : 'unknown count');
            console.log('[APIClient] Reports data structure:', data);
            
            // Handle different response structures
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.reports)) {
                return data.reports;
            } else if (data && Array.isArray(data.data)) {
                return data.data;
            }
            
            console.warn('[APIClient] Unexpected reports data structure:', data);
            return [];
            
        } catch (error) {
            console.error('[APIClient] Network error fetching reports:', error);
            return this.handleError(error, 'fetchReports');
        }
    }

    /**
     * Fetch player summaries from Steam API
     * @param {Array<string>} steamIds - Array of Steam IDs (max 100)
     * @returns {Promise<Array>} Array of player summary objects
     * 
     * Validates: Requirements 2.3, 2.6, 2.8, 10.3
     */
    async fetchPlayerSummaries(steamIds) {
        if (!steamIds || steamIds.length === 0) {
            return [];
        }
        
        try {
            // Batch steam IDs (max 50 per request to avoid URL length issues)
            const batches = [];
            for (let i = 0; i < steamIds.length; i += 50) {
                batches.push(steamIds.slice(i, i + 50));
            }
            
            console.info(`[APIClient] Fetching player summaries in ${batches.length} batches`);
            
            const allPlayers = [];
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                const steamIdsParam = batch.join(',');
                const url = `${this.config.steamApiBase}?key=${this.config.steamApiKey}&steamids=${steamIdsParam}&format=json`;
                
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        console.warn(`[APIClient] Batch ${i + 1}/${batches.length} failed with status ${response.status}`);
                        continue;
                    }
                    
                    const data = await response.json();
                    if (data.response && data.response.players) {
                        allPlayers.push(...data.response.players);
                    }
                    
                    // Задержка между батчами для избежания rate limit
                    if (i < batches.length - 1) {
                        await this.delay(500);
                    }
                } catch (batchError) {
                    console.error(`[APIClient] Error in batch ${i + 1}:`, batchError.message);
                    continue;
                }
            }
            
            console.info('[APIClient] Player summaries fetched:', allPlayers.length);
            return allPlayers;
        } catch (error) {
            return this.handleError(error, 'fetchPlayerSummaries');
        }
    }

    /**
     * Fetch player bans from Steam API
     * @param {Array<string>} steamIds - Array of Steam IDs (max 100)
     * @returns {Promise<Array>} Array of player ban objects
     * 
     * Validates: Requirements 2.3, 2.7, 2.8, 10.3
     */
    async fetchPlayerBans(steamIds) {
        if (!steamIds || steamIds.length === 0) {
            return [];
        }
        
        try {
            // Batch steam IDs (max 50 per request to avoid URL length issues)
            const batches = [];
            for (let i = 0; i < steamIds.length; i += 50) {
                batches.push(steamIds.slice(i, i + 50));
            }
            
            console.info(`[APIClient] Fetching player bans in ${batches.length} batches`);
            
            const allBans = [];
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                const steamIdsParam = batch.join(',');
                const url = `${this.config.steamApiBase}/ISteamUser/GetPlayerBans/v1/?key=${this.config.steamApiKey}&steamids=${steamIdsParam}&format=json`;
                
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        console.warn(`[APIClient] Batch ${i + 1}/${batches.length} failed with status ${response.status}`);
                        continue;
                    }
                    
                    const data = await response.json();
                    if (data.players) {
                        allBans.push(...data.players);
                    }
                    
                    // Задержка между батчами для избежания rate limit
                    if (i < batches.length - 1) {
                        await this.delay(500);
                    }
                } catch (batchError) {
                    console.error(`[APIClient] Error in batch ${i + 1}:`, batchError.message);
                    continue;
                }
            }
            
            console.info('[APIClient] Player bans fetched:', allBans.length);
            return allBans;
        } catch (error) {
            return this.handleError(error, 'fetchPlayerBans');
        }
    }

    /**
     * Delay helper for rate limiting
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handle API errors gracefully
     * @param {Error} error - The error object
     * @param {string} context - Context where error occurred
     * @returns {Array|null} Empty array or null for graceful degradation
     * 
     * Validates: Requirements 10.1, 10.3, 10.4, 10.5
     */
    handleError(error, context) {
        console.error(`[APIClient] Error in ${context}:`, error.message);
        // Return empty data to allow graceful degradation
        return [];
    }
}
