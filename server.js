const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Parse JSON bodies
app.use(express.json());

// Serve main page with loading screen (BEFORE static middleware!)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files
app.use(express.static(__dirname));

// Handle preflight requests
app.options('*', (req, res) => {
    res.sendStatus(200);
});

// Proxy for Fear API to avoid CORS issues (only for local development)
if (process.env.NODE_ENV !== 'production') {
    console.log('Running in development mode with proxy');
    
    // Proxy for Fear Servers API
    app.use('/api/fear/servers', createProxyMiddleware({
        target: 'https://api.fearproject.ru',
        changeOrigin: true,
        pathRewrite: {
            '^/api/fear/servers': '/servers'
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Proxying servers request: ${req.method} ${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('Servers proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));
    
    // Proxy for Admins List API
    app.use('/api/admins', createProxyMiddleware({
        target: 'https://api.fearproject.ru',
        changeOrigin: true,
        pathRewrite: {
            '^/api/admins': '/admins'
        },
        onProxyReq: (proxyReq, req, res) => {
            // Передаем токен через Cookie
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const actualToken = authHeader.replace('Bearer ', '');
                proxyReq.setHeader('Cookie', `access_token=${actualToken}`);
                console.log(`[Proxy] Admins request with token: ${actualToken.substring(0, 30)}...`);
            }
            console.log(`Proxying admins request: ${req.method} ${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('Admins proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));
    
    // Proxy for Fear Reports API (PATCH for closing tickets)
    app.patch('/api/reports/:id/close', async (req, res) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ error: 'No authorization token' });
            }

            const ticketId = req.params.id;
            const body = req.body;
            
            console.log('[Proxy] PATCH close ticket request:', ticketId, 'Body:', body);

            const actualToken = token.replace('Bearer ', '');
            
            const response = await fetch(`https://api.fearproject.ru/reports/${ticketId}/close`, {
                method: 'PATCH',
                headers: {
                    'Cookie': `access_token=${actualToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });

            console.log('[Proxy] PATCH close ticket response status:', response.status);
            
            let data;
            try {
                data = await response.json();
                console.log('[Proxy] PATCH close ticket response data:', data);
            } catch (e) {
                const text = await response.text();
                console.log('[Proxy] PATCH close ticket response text:', text);
                data = { message: text };
            }

            res.status(response.status).json(data);
        } catch (error) {
            console.error('[Proxy] PATCH close ticket error:', error);
            res.status(500).json({ error: 'Proxy error', message: error.message });
        }
    });
    
    // Proxy for Fear Reports API (GET requests)
    app.use('/api/reports', createProxyMiddleware({
        target: 'https://api.fearproject.ru',
        changeOrigin: true,
        pathRewrite: (path) => {
            // Убираем только /api из начала пути, оставляем /reports/...
            return path.replace('/api', '');
        },
        onProxyReq: (proxyReq, req, res) => {
            // Передаем токен через Cookie
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const actualToken = authHeader.replace('Bearer ', '');
                proxyReq.setHeader('Cookie', `access_token=${actualToken}`);
                console.log(`[Proxy] Reports request with token: ${actualToken.substring(0, 30)}...`);
            }
            console.log(`[Proxy] Reports request: ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Proxy] Reports response: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            console.error('Reports proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));
    
    app.use('/api/fear', createProxyMiddleware({
        target: 'https://api.fearproject.ru',
        changeOrigin: true,
        pathRewrite: {
            '^/api/fear': '/punishments/search'
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Proxying request: ${req.method} ${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('Proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));

    // Proxy for Fear Player API (profile/{steamid}) to get avatar and nickname
    app.use('/api/player/search', createProxyMiddleware({
        target: 'https://api.fearproject.ru',
        changeOrigin: true,
        pathRewrite: (path, req) => {
            const discord = req.query.discord;
            const query = req.query.query;
            
            if (discord) {
                console.log('[Proxy] Player search by discord:', discord);
                return `/profile/search?discord=${encodeURIComponent(discord)}`;
            }
            
            if (query) {
                console.log('[Proxy] Player search by query:', query);
                return `/profile/search?query=${encodeURIComponent(query)}`;
            }
            
            return '/profile/search';
        },
        onProxyReq: (proxyReq, req, res) => {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const actualToken = authHeader.replace('Bearer ', '');
                proxyReq.setHeader('Cookie', `access_token=${actualToken}`);
                console.log(`[Proxy] Player search with token: ${actualToken.substring(0, 20)}...`);
            }
            console.log(`[Proxy] Player search request: ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Proxy] Player search response: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            console.error('Player search proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));
    
    // Proxy for Fear Player API (profile/{steamid}) to get avatar and nickname
    app.use('/api/player', createProxyMiddleware({
        target: 'https://api.fearproject.ru',
        changeOrigin: true,
        pathRewrite: (path, req) => {
            // Extract steamid from query parameters
            const steamid = req.query.steamid;
            const mode = req.query.mode;
            const discord = req.query.discord;
            
            // Если mode=auth, используем /profile/me для проверки токена
            if (mode === 'auth' && steamid === 'me') {
                console.log('[Proxy] Auth mode - using /profile/me');
                return '/profile/me';
            }
            
            // Если discord, используем /profile/{discord} напрямую
            if (discord) {
                console.log('[Proxy] Discord search mode - using /profile/' + discord);
                return `/profile/${discord}`;
            }
            
            if (steamid) {
                return `/profile/${steamid}`;
            }
            // Fallback to original path if no steamid
            return path.replace('/api/player', '/profile');
        },
        onProxyReq: (proxyReq, req, res) => {
            // Передаем Authorization заголовок если он есть
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const actualToken = authHeader.replace('Bearer ', '');
                proxyReq.setHeader('Cookie', `access_token=${actualToken}`);
                console.log(`[Proxy] Player request with token: ${actualToken.substring(0, 20)}...`);
            }
            console.log(`[Proxy] Player request: ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Proxy] Player response: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            console.error('Player proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));

    // Proxy for Banner Images
    app.use('/api/banner', createProxyMiddleware({
        target: 'https://fearproject.ru',
        changeOrigin: true,
        pathRewrite: (path, req) => {
            // Extract banner filename from query
            const filename = req.query.file;
            if (filename) {
                // Try different paths
                return `/uploads/banners/${filename}`;
            }
            return path.replace('/api/banner', '/uploads/banners');
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[Proxy] Banner request: ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Proxy] Banner response: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            console.error('Banner proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));

    // Proxy for Admin Ban API (POST) - MUST BE BEFORE GET middleware
    app.post('/api/admin/punishments/ban', async (req, res) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ error: 'No authorization token' });
            }

            console.log('[Proxy] POST ban request:', req.body);

            // Извлекаем токен из "Bearer <token>"
            const actualToken = token.replace('Bearer ', '');
            
            // Декодируем токен чтобы показать кто делает запрос
            try {
                const payload = JSON.parse(Buffer.from(actualToken.split('.')[1], 'base64').toString());
                console.log('[Proxy] POST ban - Request from Steam ID:', payload.client_id);
                console.log('[Proxy] POST ban - Token preview:', actualToken.substring(0, 30) + '...');
            } catch (e) {
                console.log('[Proxy] POST ban - Could not decode token');
            }

            const response = await fetch('https://api.fearproject.ru/admin/punishments/ban', {
                method: 'POST',
                headers: {
                    'Cookie': `access_token=${actualToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(req.body)
            });

            const data = await response.json();
            console.log('[Proxy] POST ban response:', response.status, data);

            res.status(response.status).json(data);
        } catch (error) {
            console.error('[Proxy] POST ban error:', error);
            res.status(500).json({ error: 'Proxy error', message: error.message });
        }
    });

    // Proxy for Admin Ban API (DELETE) - Remove punishment
    app.delete('/api/admin/punishments/:id', async (req, res) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ error: 'No authorization token' });
            }

            const punishmentId = req.params.id;
            console.log('[Proxy] DELETE punishment request:', punishmentId);

            const actualToken = token.replace('Bearer ', '');
            
            // Декодируем токен
            try {
                const payload = JSON.parse(Buffer.from(actualToken.split('.')[1], 'base64').toString());
                console.log('[Proxy] DELETE - Request from Steam ID:', payload.client_id);
            } catch (e) {
                console.log('[Proxy] DELETE - Could not decode token');
            }

            const response = await fetch(`https://api.fearproject.ru/admin/punishments/${punishmentId}`, {
                method: 'DELETE',
                headers: {
                    'Cookie': `access_token=${actualToken}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            console.log('[Proxy] DELETE punishment response:', response.status, data);

            res.status(response.status).json(data);
        } catch (error) {
            console.error('[Proxy] DELETE punishment error:', error);
            res.status(500).json({ error: 'Proxy error', message: error.message });
        }
    });

    // Proxy for Admin Ban API (PATCH) - Update punishment
    app.patch('/api/admin/punishments/:id', async (req, res) => {
        try {
            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ error: 'No authorization token' });
            }

            const punishmentId = req.params.id;
            console.log('[Proxy] PATCH punishment request:', punishmentId, req.body);

            const actualToken = token.replace('Bearer ', '');
            
            // Декодируем токен
            try {
                const payload = JSON.parse(Buffer.from(actualToken.split('.')[1], 'base64').toString());
                console.log('[Proxy] PATCH - Request from Steam ID:', payload.client_id);
            } catch (e) {
                console.log('[Proxy] PATCH - Could not decode token');
            }

            const response = await fetch(`https://api.fearproject.ru/admin/punishments/${punishmentId}`, {
                method: 'PATCH',
                headers: {
                    'Cookie': `access_token=${actualToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(req.body)
            });

            const data = await response.json();
            console.log('[Proxy] PATCH punishment response:', response.status, data);

            res.status(response.status).json(data);
        } catch (error) {
            console.error('[Proxy] PATCH punishment error:', error);
            res.status(500).json({ error: 'Proxy error', message: error.message });
        }
    });

    // Proxy for Admin Punishments API (GET) - MUST BE AFTER POST endpoint
    app.use('/api/admin/punishments', createProxyMiddleware({
        target: 'https://api.fearproject.ru',
        changeOrigin: true,
        pathRewrite: {
            '^/api/admin/punishments': '/admin/punishments/my'
        },
        onProxyReq: (proxyReq, req, res) => {
            // Передаем токен через Cookie
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const actualToken = authHeader.replace('Bearer ', '');
                
                // Декодируем токен чтобы показать для какого пользователя делается запрос
                try {
                    const payload = JSON.parse(Buffer.from(actualToken.split('.')[1], 'base64').toString());
                    console.log(`[Proxy] Admin API GET - Request for Steam ID: ${payload.client_id}`);
                    console.log(`[Proxy] Admin API GET - Token preview: ${actualToken.substring(0, 30)}...`);
                } catch (e) {
                    console.log(`[Proxy] Admin API GET - Could not decode token`);
                }
                
                proxyReq.setHeader('Cookie', `access_token=${actualToken}`);
            } else {
                console.log(`[Proxy] Admin API GET - No Authorization header!`);
            }
            console.log(`[Proxy] Admin punishments request: ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[Proxy] Admin punishments response: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            console.error('Admin punishments proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));

    // Proxy for Steam API
    app.use('/api/steam', createProxyMiddleware({
        target: 'https://api.steampowered.com',
        changeOrigin: true,
        pathRewrite: {
            '^/api/steam': ''
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Proxying Steam API request: ${req.method} ${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('Steam API proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));

    // Proxy for Yooma.su API to check UMA bans (pages count)
    app.use('/api/yooma', createProxyMiddleware({
        target: 'https://yooma.su',
        changeOrigin: true,
        pathRewrite: {
            '^/api/yooma': '/api/public/read/punishments-pages'
        },
        onProxyReq: (proxyReq, req, res) => {
            // Add browser-like headers
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7');
            proxyReq.setHeader('Referer', 'https://yooma.su/');
            proxyReq.setHeader('Origin', 'https://yooma.su');
            console.log(`Proxying yooma pages request: ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`Yooma pages response: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            console.error('Yooma proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));

    // Proxy for Yooma.su API to get punishment details
    app.use('/api/yooma-details', createProxyMiddleware({
        target: 'https://yooma.su',
        changeOrigin: true,
        pathRewrite: {
            '^/api/yooma-details': '/api/public/read/punishments'
        },
        onProxyReq: (proxyReq, req, res) => {
            // Add browser-like headers
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7');
            proxyReq.setHeader('Referer', 'https://yooma.su/');
            proxyReq.setHeader('Origin', 'https://yooma.su');
            console.log(`Proxying yooma details request: ${req.method} ${req.url} -> ${proxyReq.path}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`Yooma details response: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            console.error('Yooma details proxy error:', err);
            res.status(500).json({ error: 'Proxy error', message: err.message });
        }
    }));
} else {
    console.log('Running in production mode - using serverless functions');
}

// Serve test page
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Serve loading test page
app.get('/test-loading', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-loading.html'));
});

// Serve simple loading test page
app.get('/simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-simple.html'));
});

// Serve test simple page
app.get('/test-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-simple.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Fear Protection Check Server`);
    console.log(`===========================================`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://localhost:${PORT}`);
    console.log(`\n📁 Serving files from: ${__dirname}`);
    console.log(`\n🔧 Features:`);
    console.log(`   ⚡ Config.vdf file checking`);
    console.log(`   ⚡ Fear Project API integration`);
    console.log(`   ⚡ Real-time progress indicator`);
    console.log(`\n📋 Available routes:`);
    console.log(`   /          - Main page`);
    console.log(`   /test      - API test page`);
    console.log(`   /health    - Health check`);
    console.log(`   /api/fear/servers - Fear Servers API proxy`);
    console.log(`   /api/reports - Fear Reports API proxy`);
    console.log(`   /api/fear  - Fear API proxy`);
    console.log(`   /api/player - Player API proxy`);
    console.log(`   /api/steam - Steam API proxy`);
    console.log(`\n💡 Upload a config.vdf file to test the performance!`);
    console.log(`===========================================`);
});