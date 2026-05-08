/**
 * Vercel Serverless Function for UMA.SU API Proxy
 * Checks ban status via yooma.su WebSocket API
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { steamid } = req.query;
        
        console.log('[UMA API] Received request:', { steamid });
        
        if (!steamid) {
            console.log('[UMA API] Missing Steam ID parameter');
            res.status(400).json({ error: 'Missing Steam ID parameter' });
            return;
        }
        
        // Validate Steam ID format
        const steamIdPattern = /^7656119\d{10}$/;
        if (!steamIdPattern.test(steamid)) {
            console.log('[UMA API] Invalid Steam ID format:', steamid);
            res.status(400).json({ error: 'Invalid Steam ID format' });
            return;
        }
        
        console.log('[UMA API] Checking UMA ban for:', steamid);
        
        // Check UMA ban via yooma.su HTTP API
        const yoomaUrl = `https://yooma.su/api/public/read/punishments?page=1&punish_type=0&search=${encodeURIComponent(steamid)}`;
        
        console.log('[UMA API] Requesting:', yoomaUrl);
        
        const response = await fetch(yoomaUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://yooma.su/',
                'Origin': 'https://yooma.su'
            }
        });
        
        console.log('[UMA API] Response status:', response.status);
        
        if (!response.ok) {
            console.error('[UMA API] yooma.su returned', response.status);
            res.status(200).json({ banned: false, reason: 'Ошибка API' });
            return;
        }
        
        const data = await response.json();
        console.log('[UMA API] Received punishments:', data.punishments?.length || 0);
        
        // Check if player has active bans
        if (data.punishments && Array.isArray(data.punishments) && data.punishments.length > 0) {
            const now = Math.floor(Date.now() / 1000);
            
            for (const punishment of data.punishments) {
                const expires = punishment.expires;
                const reason = punishment.reason || 'Забанен';
                
                console.log('[UMA API] Checking punishment:', {
                    steamid,
                    reason,
                    expires,
                    now,
                    isActive: expires > now
                });
                
                // Check if ban is active
                if (expires > now) {
                    console.log('[UMA API] Active ban found:', reason);
                    res.status(200).json({
                        banned: true,
                        reason: reason
                    });
                    return;
                }
            }
        }
        
        // No active bans found
        console.log('[UMA API] No active bans');
        res.status(200).json({ banned: false, reason: 'Не забанен' });
        
    } catch (error) {
        console.error('[UMA API] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message
        });
    }
}
