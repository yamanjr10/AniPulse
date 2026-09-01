// ============================================
// SERVICE WORKER
// ============================================

const CACHE_NAME = 'anipulse-v11';
const VERSION = '2.2.0';

const APP_SHELL = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/login.html',
    '/offline.html',     
    '/manifest.json',
    '/style.css',
    '/community.css',
    '/js/main.js',
    '/js/dashboard.js',
    '/js/modal.js',
    '/js/anime-list.js',
    '/js/statistics.js',
    '/js/watchlist.js',
    '/js/achievements.js',
    '/js/recap.js',
    '/js/level-system.js',
    '/js/dual-storage.js',
    '/js/firebase-init.js',
    '/js/api.js',
    '/js/community.js',
    '/js/settings.js',
    '/js/avatar.js',
    '/js/toast.js',
];

// ─── INSTALL ──────────────────────────────────────

self.addEventListener('install', (event) => {
    console.log('[SW] Installing version', VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                for (const asset of APP_SHELL) {
                    try {
                        const response = await fetch(asset);
                        if (response.ok) {
                            await cache.put(asset, response);
                            console.log(`[SW] Cached: ${asset}`);
                        } else {
                            console.warn(`[SW] Failed to cache ${asset} (status ${response.status})`);
                        }
                    } catch (err) {
                        console.warn(`[SW] Could not fetch ${asset}:`, err);
                    }
                }
                return cache;
            })
            .then(() => self.skipWaiting())
    );
});

// ─── ACTIVATE ──────────────────────────────────────

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating version', VERSION);
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ─── FETCH ──────────────────────────────────────────

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET, non-HTTPS requests
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // ─── SKIP EXTERNAL CDN REQUESTS ──────────────────
    if (url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com')) {
        return;
    }

    // ─── SKIP API CALLS ──────────────────────────────
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // ─── NAVIGATION (HTML) – OFFLINE SUPPORT ──────
    if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                })
                .catch(async () => {
                    console.log('[SW] Offline – serving cached navigation');
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    // Fallback to offline.html
                    const offline = await caches.match('/offline.html');
                    if (offline) return offline;
                    return new Response('You are offline. Please check your connection.', {
                        status: 200,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                })
        );
        return;
    }

    // ─── STATIC ASSETS (CSS, JS, JSON, IMAGES) ────
    if (url.hostname === location.hostname) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, clone);
                        });
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
                        return new Response('', { status: 200, headers: { 'Content-Type': 'image/png' } });
                    }
                    return new Response('', { status: 200 });
                })
        );
        return;
    }
});