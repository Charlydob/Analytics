(function(){
  const isDev = ['localhost','127.0.0.1'].includes(location.hostname);

  // Base del sitio ("/" o "/usuario/repositorio/")
  const BASE = location.pathname.replace(/[^/]*$/, '');

  if ('serviceWorker' in navigator) {
    if (!isDev) {
      navigator.serviceWorker.register(`${BASE}service-worker.js`, { scope: BASE }).catch(console.error);
    } else {
      navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
      if (window.caches) caches.keys().then(keys=>keys.forEach(k=>caches.delete(k)));
    }
  }

  // ...el resto de tu boot (no tocar)...
  window.addEventListener('DOMContentLoaded', boot);
  async function boot(){
    try { await App.Store.bootAuth(); } catch(e){ console.error(e); }
    App.Store.startQueueDrainer();
    const page = document.body.getAttribute('data-page');
    if (page && App.Pages && typeof App.Pages[page] === 'function') App.Pages[page]({});
    const fab = document.getElementById('fabAdd');
    if (fab) { fab.onclick = openCreateVideoModal; fab.style.display = 'block'; }
    App.UI.toast('Listo');
  }
  // openCreateVideoModal debe existir en tu main.js (según lo que ya pegaste)
})();
