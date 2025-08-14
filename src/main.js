(function(){
  const isDev = ['localhost','127.0.0.1'].includes(location.hostname);

  // Base del sitio ("/" o "/usuario/repositorio/")
  const BASE = location.pathname.replace(/[^/]*$/, '');

  if ('serviceWorker' in navigator) {
    const BASE = location.pathname.replace(/[^/]*$/, ''); // "/usuario/repo/"
    navigator.serviceWorker.register(BASE + 'service-worker.js', { scope: BASE })
      .then(()=>console.log('SW ok'))
      .catch(console.error);
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
