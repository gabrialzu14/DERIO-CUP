/* Derio Cup · service worker
   - Pantallas (HTML): red primero (siempre la última versión) y, sin conexión, la última copia guardada.
   - Ficheros estáticos, escudos, logos e imágenes optimizadas: copia local + actualización en segundo plano.
   - Los resultados (Supabase) no pasan por aquí: la app guarda su propia copia de los últimos datos. */
const VERSION = "dc-v1";
const STATIC = VERSION + "-static", PAGES = VERSION + "-pages", IMAGES = VERSION + "-img";
const MAX_IMAGES = 160;

self.addEventListener("install", e => { e.waitUntil(caches.open(PAGES).then(c => c.add("/")).catch(() => {}).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!k.startsWith(VERSION)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const trim = async (cache, max) => { const keys = await cache.keys(); for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]); };
const swr = async (req, name, max) => {
  const cache = await caches.open(name), hit = await cache.match(req);
  const net = fetch(req).then(res => { if (res.ok) { cache.put(req, res.clone()); if (max) trim(cache, max); } return res; }).catch(() => null);
  return hit || (await net) || Response.error();
};

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(PAGES);
      try {
        const res = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000))]);
        if (res.ok) cache.put("/", res.clone());
        return res;
      } catch { return (await cache.match("/")) || Response.error(); }
    })());
    return;
  }
  if (url.pathname.startsWith("/_next/image")) return e.respondWith(swr(req, IMAGES, MAX_IMAGES));
  if (url.pathname.startsWith("/_next/static/") || /^\/(escudos|patrocinadores)\//.test(url.pathname) || /\.(png|jpg|webp|svg|webmanifest|woff2?)$/.test(url.pathname)) return e.respondWith(swr(req, STATIC));
});
