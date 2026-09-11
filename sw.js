/* Offline cache.
   Network first, and the network fetch revalidates rather than trusting
   the browser's own HTTP cache, so a freshly uploaded timetable shows up
   on the next load instead of whenever the cache happens to expire.
   The cache is only there for the stretch of the walk to school with no
   signal. Bump CACHE when you change the file list. */
const CACHE = 'timetable-v2';
const FILES = [
  './', './index.html', './about.html',
  './css/app.css',
  './js/config.js', './js/timetable.js', './js/clubs.js', './js/app.js',
  './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  // A navigation Request cannot be rebuilt with a different cache mode,
  // so those go through untouched.
  const live = req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' });

  e.respondWith(
    live.then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
