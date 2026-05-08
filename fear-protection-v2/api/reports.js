/**
 * Vercel Serverless Function for Fear Reports API Proxy
 * Handles CORS and authentication for Fear Project Reports API
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    
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
        const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRfaWQiOiI3NjU2MTE5OTUyNDc4MDMyNyIsImlhdCI6MTc3NzgwNzMyNCwiZXhwIjoxNzgwMzk5MzI0fQ.PaLsOYuO-qx0AZcEG-5aQnjdNPUzD2zHFtqVxc4RmNo';
        
        // Build Fear Reports API URL
        const fearApiUrl = 'https://api.fearproject.ru/reports/recent';
        
        console.log('[Reports API] Requesting:', fearApiUrl);
        
        // Make request to Fear API with cookies
        const response = await fetch(fearApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Fear-Protection-Check/1.0',
                'Cookie': `access_token=${accessToken}; _ym_uid=1766660078200365881; _ym_d=1776260131; __ddg1_=faR8r5N1jJ3rGWxclyQR; __ddgid_=ZqbP2ZyzeZ2XMwTt; __ddgmark_=4RvtV5EigamE7TfU; _ym_isad=2; __ddg9_=104.28.229.14; _ym_visorc=w; __ddg10_=1777818152; __ddg8_=9pZgQJGSwSkScMhK`
            }
        });
        
        console.log('[Reports API] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Reports API] Error response:', errorText);
            res.status(response.status).json({ 
                error: 'Fear Reports API error', 
                status: response.status,
                message: response.statusText,
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        console.log('[Reports API] Success, reports count:', Array.isArray(data) ? data.length : 'unknown');
        
        // Return the data
        res.status(200).json(data);
        
    } catch (error) {
        console.error('[Reports API] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message,
            stack: error.stack
        });
    }
}
