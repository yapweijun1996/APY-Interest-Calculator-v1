const CACHE_NAME = 'apy-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './version.json',
  './manifest.json',
  './favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always fetch latest version.json
  if (url.pathname.endsWith('version.json')) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for HTML, CSS, JS
  if (['document', 'script', 'style'].includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, resClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for other requests
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
}); 