/**
 * Vercel Serverless Function for Google Sheets Notifications
 * Fetches notifications from Google Sheets
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
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
        // Get page parameter
        const { page } = req.query;
        
        // Google Sheets URL (published as CSV)
        // Replace with your actual Google Sheets CSV export URL
        const SHEET_URL = process.env.NOTIFICATIONS_SHEET_URL || '';
        
        if (!SHEET_URL) {
            console.log('[Notifications] No sheet URL configured');
            res.status(200).json({ notifications: [] });
            return;
        }
        
        console.log('[Notifications] Fetching from Google Sheets for page:', page);
        
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            console.error('[Notifications] Failed to fetch sheet:', response.status);
            res.status(200).json({ notifications: [] });
            return;
        }
        
        const csvText = await response.text();
        
        // Parse CSV (format: message, type, active, pages)
        const lines = csvText.split('\n').slice(1); // Skip header
        const notifications = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = line.split(',');
            if (parts.length < 4) continue;
            
            const message = parts[0].trim().replace(/^"|"$/g, '');
            const type = parts[1].trim().replace(/^"|"$/g, '') || 'info';
            const active = parts[2].trim().replace(/^"|"$/g, '').toLowerCase() === 'true';
            const pages = parts[3].trim().replace(/^"|"$/g, '').toLowerCase();
            
            if (!active || !message) continue;
            
            // Check if notification should be shown on this page
            const pageList = pages.split(';').map(p => p.trim());
            
            if (pageList.includes('all') || (page && pageList.includes(page.toLowerCase()))) {
                notifications.push({
                    message,
                    type // info, warning, error, success
                });
            }
        }
        
        console.log('[Notifications] Found', notifications.length, 'active notifications for page:', page);
        
        res.status(200).json({ notifications });
        
    } catch (error) {
        console.error('[Notifications] Exception:', error);
        res.status(200).json({ notifications: [] });
    }
}
