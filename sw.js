const CACHE_NAME = "shiftpoint-demo-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./vendor/lucide.min.js",
  "./vendor/flatpickr.min.css",
  "./vendor/flatpickr.min.js",
  "./vendor/flatpickr-hu.js",
  "./vendor/flatpickr-ro.js",
  "./language.js",
  "./storage.js",
  "./scanner.js",
  "./export.js",
  "./app.js",
  "./manifest.json",
  "./demo-data.json",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    const requestUrl = new URL(event.request.url);
    const fallbackPage = "./index.html";
    event.respondWith(
      fetch(event.request).catch(() => caches.match(fallbackPage))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

