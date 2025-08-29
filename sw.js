const CACHE_NAME = "pwa-directory-v3";
const OFFLINE_URL = "offline.html";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/apps.json",
  "/manifest.json",
  OFFLINE_URL
];

// Install SW
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate and cleanup
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// Force network-first for everything
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(res => {
        // Cache a copy if it works
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => {
        // Always show offline page when offline
        if (event.request.mode === "navigate") {
          return caches.match(OFFLINE_URL);
        }
        return caches.match(event.request);
      })
  );
});
