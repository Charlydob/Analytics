(function(){
  // SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(console.error);
  }

  async function boot(){
    try { await App.Store.bootAuth(); } catch(e){ console.error(e); }
    App.Store.startQueueDrainer();
    const page = document.body.getAttribute('data-page');
    if (page && App.Pages && typeof App.Pages[page] === 'function') {
      App.Pages[page](getPageParams());
    }
    const fab = document.getElementById('fabAdd');
    if (fab) { fab.onclick = App.Actions.addVideo; fab.style.display = 'block'; }
    App.UI.toast('Listo');
  }

  function getPageParams(){
    const url = new URL(window.location.href);
    const params = {};
    url.searchParams.forEach((v,k)=> params[k]=v);
    return params;
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
