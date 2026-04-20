// Service Worker for AniPulse - Fixed Version
const CACHE_NAME = 'anipulse-v1';
const urlsToCache = [
  '/dashboard.html',
  '/offline.html'
];

// Install event - cache essential files
self.addEventListener('install', event => {
    console.log('Service Worker installing');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache).catch(err => {
                console.log('Cache addAll failed:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - handle requests safely
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-HTTP/HTTPS requests (chrome-extension, data:, blob:, etc.)
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Skip HEAD requests - they can't be cached
    if (request.method === 'HEAD') {
        return;
    }
    
    // Skip API calls
    if (url.pathname.includes('/api/') || 
        url.hostname.includes('jikan.moe') ||
        url.hostname.includes('graphql.anilist.co')) {
        return;
    }
    
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            return fetch(request).then(networkResponse => {
                // Only cache GET requests that are successful
                if (request.method === 'GET' && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache).catch(err => {
                            console.log('Cache put failed for:', request.url, err);
                        });
                    });
                }
                return networkResponse;
            }).catch(error => {
                console.log('Fetch failed:', error);
                // Return offline page for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
                return new Response('Offline', {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                });
            });
        })
    );
});