const CACHE_STATIC = 'static-v5'; // bump versión
const STATIC_ASSETS = [
  './',
  './index.html','./videos.html','./video.html','./experiments.html','./settings.html',
  './public/manifest.json','./public/styles/app.css',
  './public/icons/icon-192.png','./public/icons/icon-512.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_STATIC).then(c=>c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_STATIC).map(k=>caches.delete(k)))));
  self.clients.claim();
});

const isData = url => url.includes('.firebaseio.com/') || url.includes('/__/firebase');

self.addEventListener('fetch', e=>{
  const req = e.request;
  if (req.method !== 'GET') return;

  // 1) Datos Firebase → network-first con fallback
  if (isData(req.url)) {
    e.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }

  // 2) Navegación/HTML/JS/CSS → NETWORK-FIRST (te actualiza sin hard-reload)
  const dest = req.destination; // 'document' | 'script' | 'style' | 'image' ...
  if (req.mode === 'navigate' || dest === 'document' || dest === 'script' || dest === 'style') {
    e.respondWith(
      fetch(req).then(resp=>{
        const copy = resp.clone();
        caches.open(CACHE_STATIC).then(c=>c.put(req, copy));
        return resp;
      }).catch(()=>caches.match(req).then(r=> r || caches.match('./index.html')))
    );
    return;
  }

  // 3) Imágenes/íconos → cache-first
  e.respondWith(
    caches.match(req).then(res=> res || fetch(req).then(resp=>{
      const copy = resp.clone();
      caches.open(CACHE_STATIC).then(c=>c.put(req, copy));
      return resp;
    }))
  );
});
