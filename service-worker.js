// ============================================
// SERVICE WORKER - NETWORK FIRST VERSION
// Always fetches fresh content from server
// ============================================

const CACHE_NAME = 'anipulse-v7';
const VERSION = '2.0.0';

// Only cache these for OFFLINE fallback (NOT for daily use)
const OFFLINE_FALLBACKS = [
  '/offline.html',
  '/icon/icon-192x192.png',
  '/icon/icon-512x512.png'
];

// Install event - DON'T aggressively cache main files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Only cache offline fallback files
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

// Activate event - clean old caches
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

// Fetch event - NETWORK FIRST strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and data URLs  
  if (!url.protocol.startsWith('http')) return;
  
  // CRITICAL: HTML files - ALWAYS fetch from network, NEVER from cache
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
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
  
  // CSS and JS files - ALWAYS fetch fresh from network
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }).catch(() => {
        // Only return cached if network fails
        return caches.match(request);
      })
    );
    return;
  }
  
  // For manifest.json - always fresh
  if (url.pathname.endsWith('manifest.json')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }
  
  // For images/icons - cache first with background update
  if (url.pathname.includes('/icon/') || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          return cachedResponse;
        });
        
        // Return cached immediately, update in background
        if (cachedResponse) {
          fetchPromise.catch(() => {});
          return cachedResponse;
        }
        return fetchPromise;
      })
    );
    return;
  }
  
  // For everything else - network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});