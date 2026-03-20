const CACHE_NAME = 'adk-invoice-v2';
const BASE_PATH = '/adk-invoice-pwa/';

// Files to cache - note the base path
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icon-192.png',
  BASE_PATH + 'icon-512.png'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache failed:', err);
      })
  );
  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Fetch event - serve from cache first
self.addEventListener('fetch', event => {
  // Handle requests properly
  let requestUrl = event.request.url;
  
  // Check if request is for our app
  if (requestUrl.includes('theadkgroups-hub.github.io') || requestUrl.includes('localhost')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            // Return cached version
            return response;
          }
          // If not in cache, fetch from network
          return fetch(event.request)
            .then(response => {
              // Don't cache if not successful
              if (!response || response.status !== 200) {
                return response;
              }
              // Clone the response
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            });
        })
        .catch(() => {
          // If offline and not in cache, return offline page
          return caches.match(BASE_PATH + 'index.html');
        })
    );
  } else {
    // For external requests (like WhatsApp), just fetch
    event.respondWith(fetch(event.request));
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
});
