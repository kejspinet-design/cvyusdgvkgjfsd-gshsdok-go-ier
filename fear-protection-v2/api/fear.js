/**
 * Vercel Serverless Function for Fear API Proxy
 * Handles CORS and authentication for Fear Project API
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
        // Check if this is a servers request
        const { action } = req.query;
        
        if (action === 'servers') {
            console.log('[Fear API] Fetching servers list');
            
            // Fetch servers from Fear API
            const serversUrl = 'https://api.fearproject.ru/servers';
            
            const response = await fetch(serversUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Fear-Protection-Check/1.0'
                }
            });
            
            console.log('[Fear API] Servers response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Fear API] Servers error:', errorText);
                res.status(response.status).json({ 
                    error: 'Fear API error', 
                    status: response.status,
                    message: response.statusText
                });
                return;
            }
            
            const data = await response.json();
            console.log('[Fear API] Servers data received');
            
            res.status(200).json(data);
            return;
        }
        
        // Otherwise, handle punishments search
        const { q, page = 1, limit = 10, type = 1 } = req.query;
        
        console.log('[Fear API] Received request:', { q, page, limit, type });
        
        if (!q) {
            console.log('[Fear API] Missing Steam ID parameter');
            res.status(400).json({ error: 'Missing Steam ID parameter' });
            return;
        }
        
        // Validate Steam ID format
        const steamIdPattern = /^7656119\d{10}$/;
        if (!steamIdPattern.test(q)) {
            console.log('[Fear API] Invalid Steam ID format:', q);
            res.status(400).json({ error: 'Invalid Steam ID format' });
            return;
        }
        
        // Build Fear API URL
        const fearApiUrl = `https://api.fearproject.ru/punishments/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}&type=${type}`;
        
        console.log('[Fear API] Requesting:', fearApiUrl);
        
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
        
        console.log('[Fear API] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Fear API] Error response:', errorText);
            res.status(response.status).json({ 
                error: 'Fear API error', 
                status: response.status,
                message: response.statusText,
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        console.log('[Fear API] Success data:', JSON.stringify(data, null, 2));
        
        // Return the data
        res.status(200).json(data);
        
    } catch (error) {
        console.error('[Fear API] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message,
            stack: error.stack
        });
    }
}