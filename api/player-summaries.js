/**
 * Vercel Serverless Function for Steam Player Summaries
 * Direct proxy to Steam GetPlayerSummaries API
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { key, steamids, format } = req.query;
        
        if (!key || !steamids) {
            res.status(400).json({ error: 'Missing required parameters: key, steamids' });
            return;
        }
        
        // Build Steam API URL
        const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamids}&format=${format || 'json'}`;
        
        console.log('[Player Summaries] Fetching from Steam API');
        
        // Fetch from Steam API
        const response = await fetch(steamApiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Fear-Protection/1.0'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Player Summaries] Steam API error:', response.status, errorText);
            res.status(response.status).json({ 
                error: 'Steam API error',
                status: response.status,
                details: errorText
            });
            return;
        }
        
        const data = await response.json();
        
        // Return data
        res.status(200).json(data);
        
    } catch (error) {
        console.error('[Player Summaries] Exception:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}
