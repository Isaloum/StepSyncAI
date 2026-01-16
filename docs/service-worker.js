// Service Worker for MindTrackAI PWA
// Version: Increment this on every deploy to force cache updates
const CACHE_VERSION = 'mindtrack-v6-2026-01-15';
const CACHE_ASSETS = [
  './',
  // Avoid pinning a potentially stale HTML shell; we always prefer network for HTML.
  // CSS and JS are NOT cached here - they use network-first strategy below
  // This ensures users always get the latest styles and functionality
];

// Install event - cache minimal assets and take control immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CACHE_ASSETS);
      })
      // skipWaiting() forces the new SW to activate immediately
      // instead of waiting for all tabs to close
      .then(() => {
        console.log('[SW] Skipping waiting - activating immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete all old cache versions
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_VERSION)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    // clients.claim() makes the new SW control all open pages immediately
    // without requiring a page reload
    .then(() => {
      console.log('[SW] Claiming all clients');
      return self.clients.claim();
    })
    // Notify all clients that a new version is active
    .then(() => {
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Fetch event - NETWORK-FIRST strategy for HTML/CSS/JS to prevent stale UI bug
// This is the key fix: Always try network first, cache only as fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For HTML, CSS, JS files: use NETWORK-FIRST strategy
  // This ensures users always get the latest version
  if (event.request.url.includes('.html') || 
      event.request.url.includes('.css') || 
      event.request.url.includes('.js') ||
      url.pathname === '/' ||
      url.pathname === '/MindTrackAI/' ||
      url.pathname.endsWith('/')) {
    
    event.respondWith(
      // Try network first
      fetch(new Request(event.request, { cache: 'reload' }))
        .then((networkResponse) => {
          // Network success: update cache and return response
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed: fallback to cache (offline mode)
          console.log('[SW] Network failed, serving from cache:', event.request.url);
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('./');
          });
        })
    );
  } 
  // For other assets (images, fonts, etc.): use CACHE-FIRST strategy
  // These change less frequently and can be safely cached
  else {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Not in cache: fetch from network and cache it
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_VERSION).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          });
        })
    );
  }
});
