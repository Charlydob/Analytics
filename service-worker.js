self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
// Passthrough: Chrome exige un SW con fetch handler para ser "installable"
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
