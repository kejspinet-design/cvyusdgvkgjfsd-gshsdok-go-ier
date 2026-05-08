/**
 * Vercel Serverless Function for Steam API Proxy
 * Handles CORS and proxies requests to Steam Web API
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
        // Get the full URL path and query
        const fullUrl = req.url || '';
        
        console.log('[Steam API] Full URL:', fullUrl);
        
        // Extract everything after /api/steam
        const match = fullUrl.match(/\/api\/steam(\/.*)/);
        
        if (!match || !match[1]) {
            res.status(400).json({ error: 'Missing Steam API path' });
            return;
        }
        
        const steamPath = match[1];
        
        // Build Steam API URL
        const steamApiUrl = `https://api.steampowered.com${steamPath}`;
        
        console.log('[Steam API] Proxying to:', steamApiUrl);
        
        // Make request to Steam API
        const response = await fetch(steamApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Fear-Protection-Check/1.0'
            }
        });
        
        console.log('[Steam API] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Steam API] Error response:', errorText);
            res.status(response.status).json({ 
                error: 'Steam API error', 
                status: response.status,
                message: response.statusText,
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        console.log('[Steam API] Success');
        
        // Return the data
        res.status(200).json(data);
        
    } catch (error) {
        console.error('[Steam API] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message,
            stack: error.stack
        });
    }
}
