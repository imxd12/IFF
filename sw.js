/* =========================
   MONEYFLOW SERVICE WORKER
   Offline Support & Caching
========================= */

const CACHE_NAME = 'moneyflow-v1.0.0';
const STATIC_CACHE = 'moneyflow-static-v1.0.0';
const DYNAMIC_CACHE = 'moneyflow-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './spendly.html',
  './nexus.html',
  './pocketcal.html',
  './global.css',
  './index.css',
  './spendly.css',
  './nexus.css',
  './pocketcal.css',
  './global.js',
  './index.js',
  './spendly.js',
  './nexus.js',
  './pocketcal.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extension requests
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then(networkResponse => {
            // Clone the response
            const responseClone = networkResponse.clone();
            
            // Cache dynamic content
            if (networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(request, responseClone);
                  console.log('[SW] Cached dynamic asset:', request.url);
                });
            }
            
            return networkResponse;
          })
          .catch(err => {
            console.error('[SW] Fetch failed:', err);
            
            // Return offline fallback page if available
            return caches.match('./index.html');
          });
      })
  );
});

// Background sync for future enhancements
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Sync logic here
      Promise.resolve()
    );
  }
});

// Push notification support
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: './icon-192.png',
    badge: './icon-96.png',
    vibrate: [200, 100, 200],
    tag: 'moneyflow-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('MoneyFlow', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

// Message handler for communication with main app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});
