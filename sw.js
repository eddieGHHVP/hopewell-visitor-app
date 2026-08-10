// Hopewell Visitor App — service worker
//
// Bump CACHE_NAME every time you deploy a change (e.g. v1 -> v2). Changing
// this file's contents is what tells phones a new version exists at all —
// without a change here, some phones may keep the old version cached.
const CACHE_NAME = 'hopewell-visitor-app-v3';

// Only cache files that actually exist in this project. Don't add icons,
// manifest.json, or anything else here unless those files are really in
// the repo — a single missing file makes the whole cache step fail.
const ASSETS_TO_CACHE = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle simple same-origin GET requests for this app's own page.
  // Crucially, this leaves the Google Apps Script calls (a different
  // origin) completely untouched, so visitor data always syncs live and
  // is never served from a stale cache.
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Network-first: always try to fetch the newest version when online,
  // and only fall back to the cached copy if the network fails (offline).
  // This matters a lot for an app that changes often — cache-first would
  // mean updates never show up until the cache is manually cleared.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request.mode === 'navigate' ? './index.html' : request))
  );
});
