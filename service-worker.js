// service-worker.js
const CACHE_NAME = 'anipulse-v4';
const STATIC_CACHE = 'anipulse-static-v1';

// URLs to cache - ADDED all icon paths
const STATIC_ASSETS = [
  '/dashboard.html',
  '/offline.html',
  '/dashboard.css',
  '/main.js',
  '/manifest.json',
  // Add all your icons
  '/icon/icon.png',
  '/icon/icon-72x72.png',
  '/icon/icon-96x96.png',
  '/icon/icon-128x128.png',
  '/icon/icon-144x144.png',
  '/icon/icon-152x152.png',
  '/icon/icon-192x192.png',
  '/icon/icon-384x384.png',
  '/icon/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      console.log('[SW] Caching static assets');
      for (const asset of STATIC_ASSETS) {
        try {
          const response = await fetch(asset);
          if (response.ok) {
            await cache.put(asset, response);
            console.log(`[SW] Cached: ${asset}`);
          } else {
            console.log(`[SW] Failed to cache: ${asset} (${response.status})`);
          }
        } catch (err) {
          console.log(`[SW] Error caching ${asset}:`, err);
        }
      }
      return cache;
    }).then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== STATIC_CACHE && cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and data URLs
  if (!url.protocol.startsWith('http')) return;
  
  // Handle HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
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
  
  // For static assets: cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached, update in background for icons
        if (request.url.includes('/icon/')) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (request.destination === 'image') {
          // Return a transparent pixel for missing images
          return new Response('', { status: 200, headers: { 'Content-Type': 'image/png' } });
        }
        return new Response('Offline', { status: 200 });
      });
    })
  );
});