/**
 * Vercel Serverless Function for Punishments API Proxy
 * Proxies requests to Fear Project Punishments API
 */

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        // Get query parameters
        const { page = '1', limit = '10', type = '2' } = req.query;
        
        // Build Fear API URL
        const fearApiUrl = `https://api.fearproject.ru/punishments?page=${page}&limit=${limit}&type=${type}`;
        
        console.log('[Punishments API] Fetching:', fearApiUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        const response = await fetch(fearApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Fear-Protection/1.0'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('[Punishments API] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Punishments API] Error:', errorText);
            res.status(response.status).json({ 
                error: 'Fear API error', 
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        res.status(200).json(data);
        
    } catch (error) {
        console.error('[Punishments API] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message
        });
    }
}
