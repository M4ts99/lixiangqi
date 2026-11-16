const cacheName = 'xiangqi-offline-v6';
const assets = ['./', './index.html', './style.css', './app.mjs', './rules.mjs',
  './engine.mjs', './worker.mjs', './lessons.mjs', './cloud.mjs', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('xiangqi-offline-') && key !== cacheName)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(event.request) ?? (event.request.mode === 'navigate'
      ? await cache.match('./index.html') : Response.error());
  }));
});
