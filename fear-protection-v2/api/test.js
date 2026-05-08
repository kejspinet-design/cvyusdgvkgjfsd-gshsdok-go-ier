/**
 * Simple test function to verify Vercel serverless functions work
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
    
    console.log('[Test API] Request received:', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: req.headers
    });
    
    res.status(200).json({
        message: 'Test API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        query: req.query,
        url: req.url
    });
}