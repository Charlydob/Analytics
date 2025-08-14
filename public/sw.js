/* Cache-first estáticos + network-first datos */
const CACHE_STATIC = 'static-v1';
const STATIC_ASSETS = [
  './',
  '../index.html',
  './styles/app.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
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
  if (isData(req.url)) {
    e.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then(res=> res || fetch(req).then(resp=>{
      const copy = resp.clone();
      caches.open(CACHE_STATIC).then(c=>c.put(req, copy));
      return resp;
    }).catch(()=>caches.match('../index.html')))
  );
});
