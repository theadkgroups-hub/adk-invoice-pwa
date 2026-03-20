const CACHE_NAME = 'adk-invoice-v2';
const BASE_PATH = '/adk-invoice-pwa/';

// Files to cache
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icon-192.png',
  BASE_PATH + 'icon-512.png'
];

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Service Worker: Cache failed', err);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle requests for our app
  if (url.pathname.startsWith(BASE_PATH) || url.pathname === '/adk-invoice-pwa') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('Service Worker: Serving from cache:', event.request.url);
            return response;
          }
          console.log('Service Worker: Fetching from network:', event.request.url);
          return fetch(event.request)
            .then(networkResponse => {
              // Cache successful responses
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            });
        })
        .catch(() => {
          // If offline and not in cache, return index.html
          console.log('Service Worker: Offline - returning index.html');
          return caches.match(BASE_PATH + 'index.html');
        })
    );
  } else {
    // For external requests, just fetch
    event.respondWith(fetch(event.request));
  }
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});
