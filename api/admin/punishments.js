/**
 * Vercel Serverless Function for Admin Punishments API Proxy
 * Proxies requests to Fear Project Admin API
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const token = req.headers.authorization;
        
        if (!token) {
            res.status(401).json({ error: 'Missing authorization token' });
            return;
        }
        
        let fearApiUrl;
        let method = req.method;
        let body = null;
        
        // Handle different request types
        if (method === 'GET') {
            // GET /api/admin/punishments?type=0
            const { type } = req.query;
            fearApiUrl = `https://api.fearproject.ru/admin/punishments/my${type ? `?type=${type}` : ''}`;
        } else if (method === 'POST') {
            // POST /api/admin/punishments/ban
            fearApiUrl = 'https://api.fearproject.ru/admin/punishments/ban';
            body = JSON.stringify(req.body);
        } else if (method === 'DELETE') {
            // DELETE /api/admin/punishments/:id
            const id = req.query.id || req.url.split('/').pop();
            fearApiUrl = `https://api.fearproject.ru/admin/punishments/${id}`;
        } else if (method === 'PATCH') {
            // PATCH /api/admin/punishments/:id
            const id = req.query.id || req.url.split('/').pop();
            fearApiUrl = `https://api.fearproject.ru/admin/punishments/${id}`;
            body = JSON.stringify(req.body);
        } else {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        
        console.log('[Admin Punishments API] Request:', method, fearApiUrl);
        
        // Make request to Fear API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        const fetchOptions = {
            method,
            headers: {
                'Accept': 'application/json',
                'Authorization': token,
                'User-Agent': 'Fear-Protection/1.0'
            },
            signal: controller.signal
        };
        
        if (body) {
            fetchOptions.headers['Content-Type'] = 'application/json';
            fetchOptions.body = body;
        }
        
        const response = await fetch(fearApiUrl, fetchOptions);
        
        clearTimeout(timeoutId);
        
        console.log('[Admin Punishments API] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Admin Punishments API] Error:', errorText);
            res.status(response.status).json({ 
                error: 'Fear API error', 
                status: response.status,
                message: response.statusText,
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        res.status(200).json(data);
        
    } catch (error) {
        console.error('[Admin Punishments API] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message
        });
    }
}
