// SWARG Shield - Secure Service Worker v3.0
// NO DATA CACHING - Security First

const CACHE_NAME = 'swarg-app-shell-v3';
const NO_CACHE_PATHS = [
  '/api/',
  '/encrypt',
  '/decrypt',
  /token/,
  /secret/,
  /password/
];

// Install - Cache only app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        // Only cache essential static assets
        // NO USER DATA
      ]);
    })
  );
});

// Activate - Clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Security-focused strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NEVER cache sensitive paths
  if (NO_CACHE_PATHS.some(path => {
    if (typeof path === 'string') {
      return url.pathname.includes(path);
    }
    return path.test(url.pathname);
  })) {
    // Network only, no caching
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For app shell, cache-first
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Only cache if it's a static asset
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});

// Security: Clear all caches on logout
self.addEventListener('message', (event) => {
  if (event.data === 'clear-cache') {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
});

// Prevent caching of POST requests
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST') {
    event.respondWith(fetch(event.request));
  }
});
