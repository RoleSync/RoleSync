const CACHE_NAME = 'rolesync-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.svg',
  '/favicon.png',
  '/manifest.json'
];

// Install Event - cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // console.log('[Service Worker] Caching App Shell and static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            // console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - network first, fallback to cache for assets, network only for APIs
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Exclude Supabase, dev server / HMR, chrome extensions, and non-GET requests from service worker
  if (
    url.includes('supabase.co') || 
    url.includes('chrome-extension') ||
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('/@vite/') ||
    url.includes('/@fs/') ||
    url.includes('/@id/') ||
    url.includes('.hot-update.') ||
    url.endsWith('.ts') ||
    url.endsWith('.tsx') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If it's a valid response, cache a clone for offline fallback
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Fallback to cache if network fails
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback to index.html for navigation requests
        if (event.request.mode === 'navigate') {
          const indexResponse = await caches.match('/index.html');
          if (indexResponse) return indexResponse;
        }
        
        // Return 503 Service Unavailable when offline instead of synthetic 408
        return new Response('Network unavailable and resource is not cached.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});
