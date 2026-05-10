/**
 * Vercel Serverless Function for Admins List API Proxy
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
        console.log('[Admins API] Request received');
        console.log('[Admins API] Headers:', Object.keys(req.headers));
        
        const fearApiUrl = 'https://api.fearproject.ru/admins';
        
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
        
        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({ 
                error: 'Fear API error', 
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        res.status(200).json(data);
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message
        });
    }
}
