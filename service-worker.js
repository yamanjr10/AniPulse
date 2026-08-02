// ============================================
// SERVICE WORKER - NETWORK FIRST VERSION
// ============================================

const CACHE_NAME = 'anipulse-v10';
const VERSION = '2.1.0';

// ONLY cache local files - NO external CDNs!
const OFFLINE_FALLBACKS = [
    '/offline.html',        // now served from root (or public/ but at root URL)
    '/dashboard.html'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Installing version', VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const asset of OFFLINE_FALLBACKS) {
                try {
                    const response = await fetch(asset);
                    if (response.ok) {
                        await cache.put(asset, response);
                        console.log(`[SW] Cached fallback: ${asset}`);
                    }
                } catch (err) {
                    console.log(`[SW] Failed to cache ${asset}:`, err);
                }
            }
            return cache;
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating version', VERSION);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - IGNORE external CDNs
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // IGNORE external CDNs - let browser handle them directly
    if (url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        // Don't intercept CDN requests - let them load normally
        return;
    }

    // HTML files - network first
    if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(request, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
            }).catch(async () => {
                console.log('[SW] Network failed, serving offline page');
                const cachedResponse = await caches.match('/offline.html');
                if (cachedResponse) return cachedResponse;
                return new Response('Offline - Please check your connection', {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' }
                });
            })
        );
        return;
    }

    // Local CSS/JS files - network first
    if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
        // Only intercept LOCAL files
        if (url.hostname === location.hostname) {
            event.respondWith(
                fetch(request, { cache: 'no-store' }).catch(() => {
                    return caches.match(request);
                })
            );
            return;
        }
    }

    // For manifest.json (now at root)
    if (url.pathname.includes('manifest.json')) {
        event.respondWith(
            fetch('/manifest.json', { cache: 'no-store' }).catch(() => {
                return caches.match('/manifest.json');
            })
        );
        return;
    }

    // For everything else local - network first
    if (url.hostname === location.hostname) {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match(request);
            })
        );
    }
    // External resources - let them load normally (don't intercept)
});