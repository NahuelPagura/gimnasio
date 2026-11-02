// Guarda la app en el celular para que abra al instante y funcione sin señal en el gimnasio.
// La app se sirve desde la caché y se actualiza en segundo plano: los cambios aparecen la próxima vez que se abre.
const CACHE = "fierros-v1";
const SHELL = ["./", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !fonts) return;
  // Todas las páginas de la app son la misma: index.html
  const key = req.mode === "navigate" ? "./" : req;
  ev.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(key, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res.ok || res.type === "opaque") cache.put(key, res.clone());
      return res;
    });
    if (hit) {
      // Las fuentes no cambian; la app sí, así que se refresca en segundo plano
      if (!fonts) ev.waitUntil(net.catch(() => {}));
      return hit;
    }
    return net;
  }));
});
