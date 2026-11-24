const prefix = 'tenerife2026-';
const cacheName = prefix + 'v1';
const guide = new URL('./', self.registration.scope).href;
const assets = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'sabores-de-tenerife.webp']
  .map((path) => new URL(path, guide).href);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) =>
    cache.addAll([guide, ...assets].map((url) => new Request(url, { cache: 'reload' })))
  ));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(prefix) && name !== cacheName)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  url.search = '';
  if (event.request.method !== 'GET' || (url.href !== guide && !assets.includes(url.href))) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(url.href);
    if (event.request.mode === 'navigate') {
      try {
        const response = await fetch(event.request);
        if (response.ok || !cached) return response;
      } catch (error) {
        if (!cached) throw error;
      }
      return cached;
    }
    return cached || fetch(event.request);
  })());
});
