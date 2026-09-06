﻿const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const animeRoutes = require('./routes/anime');
const syncRoutes = require('./routes/sync');
const rankingRoutes = require('./routes/ranking');
const friendsRoutes = require('./routes/friends');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://ani-pulse.netlify.app',
    'https://anipulse-63jv.onrender.com'
];

if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, ''));
    envOrigins.forEach(url => {
        if (!allowedOrigins.includes(url)) {
            allowedOrigins.push(url);
        }
    });
}

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('✅ CORS allowed:', origin);
            callback(null, true);
        } else {
            console.log('❌ CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================
// RATE LIMITING
// ============================================

// Global limit: 200 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        const exemptPaths = ['/api/firebase-config', '/api/sync/status', '/api/health'];
        return exemptPaths.includes(req.path);
    }
});
app.use('/api/', limiter);

// Stricter for auth endpoints (10 per 15 min)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// FIREBASE CLIENT CONFIG ENDPOINT
// ============================================
app.get('/api/firebase-config', (req, res) => {
    const config = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
        messagingSenderId: process.env.FIREBASE_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };
    res.json(config);
});

// Static files
app.use(express.static(path.join(__dirname, '..', 'Frontend')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// HTML page routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// 404 handler
app.use((req, res) => {
    const possiblePaths = [
        path.join(__dirname, '..', 'public', '404.html'),
        path.join(__dirname, '..', 'Frontend', '404.html'),
        path.join(__dirname, '..', 'public', 'error', '404.html')
    ];
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            return res.status(404).sendFile(filePath);
        }
    }
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>404 - Page Not Found</title>
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#0B1120,#1A1F2E);min-height:100vh;display:flex;align-items:center;justify-content:center;color:white}
            .error-container{text-align:center;padding:40px}
            h1{font-size:120px;font-weight:800;background:linear-gradient(135deg,#6366F1,#8B5CF6);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:20px}
            p{font-size:18px;color:#94A3B8;margin-bottom:30px}
            a{display:inline-block;padding:12px 30px;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:white;text-decoration:none;border-radius:40px;font-weight:600;transition:transform .2s ease}
            a:hover{transform:translateY(-2px)}
        </style>
        </head>
        <body>
            <div class="error-container"><h1>404</h1><p>Oops! The page you're looking for doesn't exist.</p><a href="/">← Back to Home</a></div>
        </body>
        </html>
    `);
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS blocked: Origin not allowed' });
    }
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Root: ${path.join(__dirname, '..')}`);
    console.log(`📁 Frontend: ${path.join(__dirname, '..', 'Frontend')}`);
    console.log(`📁 Public: ${path.join(__dirname, '..', 'public')}`);
    console.log(`📦 Payload limit: 50mb\n`);
    console.log(`🔥 Firebase config endpoint: /api/firebase-config`);
});