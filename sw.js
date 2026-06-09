// ── Service Worker · XXIV Campeonato Regional del Sur ──────────
const CACHE_NAME = 'campeonato-v1';
const OFFLINE_URLS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar: cachea los recursos principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activar: limpia caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first para peticiones de API, cache-first para assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Peticiones a Google Apps Script o APIs externas: siempre red
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // Resto: Network-first con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Solo cachear respuestas válidas GET
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
