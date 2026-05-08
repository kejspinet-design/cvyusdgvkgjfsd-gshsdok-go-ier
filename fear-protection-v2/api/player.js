/**
 * Vercel Serverless Function for Fear Player API Proxy
 * Fetches player nickname and avatar from Fear Project API
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
        const { steamid, mode = 'public' } = req.query;
        
        console.log('[Player API] Received request:', { steamid, mode });
        
        if (!steamid) {
            console.log('[Player API] Missing Steam ID parameter');
            res.status(400).json({ error: 'Missing Steam ID parameter' });
            return;
        }
        
        // Validate Steam ID format
        const steamIdPattern = /^7656119\d{10}$/;
        if (!steamIdPattern.test(steamid)) {
            console.log('[Player API] Invalid Steam ID format:', steamid);
            res.status(400).json({ error: 'Invalid Steam ID format' });
            return;
        }
        
        // Build Fear API URL for player data - using profile endpoint
        const fearApiUrl = `https://api.fearproject.ru/profile/${encodeURIComponent(steamid)}`;
        
        console.log('[Player API] Requesting:', fearApiUrl);
        
        // Make request to Fear API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
        
        const response = await fetch(fearApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Fear-Protection-Check/1.0'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('[Player API] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Player API] Error response:', errorText);
            res.status(response.status).json({ 
                error: 'Fear API error', 
                status: response.status,
                message: response.statusText,
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        console.log('[Player API] Success data:', JSON.stringify(data, null, 2));
        
        // Return the data directly (fetchPlayerData expects this format)
        res.status(200).json(data);
        
    } catch (error) {
        console.error('[Player API] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message,
            stack: error.stack
        });
    }
}