// SWARG Shield Service Worker v5.0
const CACHE_NAME = 'swarg-shield-v5';

// Install - Cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll([
                    './',
                    './index.html',
                    // Cache essential assets only
                    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
                    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@800;900&display=swap'
                ]);
            })
    );
});

// Activate - Clean old caches
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
        })
    );
});

// Fetch - Cache-first strategy for assets
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and sensitive data
    if (event.request.method !== 'GET' || 
        event.request.url.includes('encrypt') ||
        event.request.url.includes('decrypt')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request)
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    });
            })
    );
});

// Message handler for security operations
self.addEventListener('message', (event) => {
    if (event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME);
        event.ports[0].postMessage({ success: true });
    }
});
