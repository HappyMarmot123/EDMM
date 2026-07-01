const CACHE_NAME = "edmm-audio-controls-v1";

self.addEventListener("install", (event) => {
  const preCache = caches.open(CACHE_NAME).then((cache) => {
    return cache.addAll(["/", "/manifest.webmanifest"]).catch(() => {});
  });

  event.waitUntil(Promise.all([self.skipWaiting(), preCache]));
});

self.addEventListener("activate", (event) => {
  const cleanupCache = caches.keys().then((keys) => {
    return Promise.all(
      keys
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName)),
    );
  });

  event.waitUntil(Promise.all([self.clients.claim(), cleanupCache]));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const shouldSkipCache =
    request.method !== "GET" ||
    request.url.startsWith("chrome-extension:") ||
    request.url.startsWith("chrome://") ||
    request.destination === "audio" ||
    request.destination === "video";

  if (shouldSkipCache) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || !response.ok) {
          return response;
        }

        const cachePromise = caches.open(CACHE_NAME).then((cache) => {
          return cache.put(request, response.clone());
        });
        event.waitUntil(cachePromise);

        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        return cached || Response.error();
      }),
  );
});
