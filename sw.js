const CACHE_NAME = 'finfusion-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './spendly.html',
  './nexus.html',
  './pocketcal.html',
  './global.css',
  './index.css',
  './spendly.css',
  './global.js',
  './index.js',
  './spendly.js',
  './manifest.json',
  './imad1.png',   // profile photo
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

// Fetch requests: serve cached resources first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
