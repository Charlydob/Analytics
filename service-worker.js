// Base del sitio (ej: "/" en localhost, "/tu-repo/" en GitHub Pages)
const BASE = new URL(self.registration.scope).pathname.replace(/\/?$/, '/');

const CACHE_STATIC = 'static-v6';

// Helper para prefijar rutas al BASE
const p = (path) => BASE + path.replace(/^\.?\//, '');

const STATIC_ASSETS = [
  p(''),
  p('index.html'),
  p('videos.html'),
  p('video.html'),
  p('experiments.html'),
  p('settings.html'),
  p('manifest.webmanifest'),
  p('public/styles/app.css'),
  p('public/icons/icon-192.png'),
  p('public/icons/icon-512.png')
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_STATIC).then(c=>c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE_STATIC).map(k=>caches.delete(k))
  )));
  self.clients.claim();
});

const isData = url => url.includes('.firebaseio.com/') || url.includes('/__/firebase');

self.addEventListener('fetch', e=>{
  const req = e.request;
  if (req.method !== 'GET') return;

  if (isData(req.url)) {
    e.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }

  // Network-first para HTML/JS/CSS
  const dest = req.destination;
  if (req.mode === 'navigate' || dest === 'document' || dest === 'script' || dest === 'style') {
    e.respondWith(
      fetch(req).then(resp=>{
        const copy = resp.clone();
        caches.open(CACHE_STATIC).then(c=>c.put(req, copy));
        return resp;
      }).catch(()=>caches.match(req).then(r=> r || caches.match(p('index.html'))))
    );
    return;
  }

  // Cache-first para imágenes/iconos
  e.respondWith(
    caches.match(req).then(res => res || fetch(req).then(resp=>{
      const copy = resp.clone();
      caches.open(CACHE_STATIC).then(c=>c.put(req, copy));
      return resp;
    }))
  );
});
