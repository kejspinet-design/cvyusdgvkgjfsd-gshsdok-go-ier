/**
 * Vercel Serverless Function for Reports History API Proxy
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
        // Vercel normalizes headers to lowercase
        const authHeader = req.headers.authorization || req.headers.Authorization;
        
        console.log('[Reports History API] Headers:', Object.keys(req.headers));
        console.log('[Reports History API] Auth header:', authHeader ? 'present' : 'missing');
        
        if (!authHeader) {
            res.status(401).json({ error: 'Missing authorization token' });
            return;
        }
        
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;
        
        // Get query parameters
        const { page, status } = req.query;
        
        // Build Fear API URL with query params
        let fearApiUrl = 'https://api.fearproject.ru/reports/history';
        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (status) params.append('status', status);
        if (params.toString()) {
            fearApiUrl += `?${params.toString()}`;
        }
        
        console.log('[Reports History API] Fetching:', fearApiUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        const response = await fetch(fearApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cookie': `access_token=${token}`,
                'User-Agent': 'Fear-Protection/1.0'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('[Reports History API] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Reports History API] Error:', errorText);
            res.status(response.status).json({ 
                error: 'Fear API error', 
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        res.status(200).json(data);
        
    } catch (error) {
        console.error('[Reports History API] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message
        });
    }
}
