const CACHE_NAME = 'apy-calc-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/style.css',
  '/app.js'
];

// Version check endpoint - replace with your actual version check endpoint
const VERSION_CHECK_URL = '/version.json';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((keyList) =>
        Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }))
      ),
      // Check for updates
      checkForUpdates()
    ])
  );
  self.clients.claim();
});

async function checkForUpdates() {
  try {
    const response = await fetch(VERSION_CHECK_URL, { cache: 'no-cache' });
    const data = await response.json();
    
    // Notify all clients about the update
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: data.version
      });
    });
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

self.addEventListener('fetch', (event) => {
  // Skip version check requests
  if (event.request.url.includes(VERSION_CHECK_URL)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if available
      if (response) {
        // Check for updates in the background
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // Network request failed, continue with cached response
          });
        return response;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 