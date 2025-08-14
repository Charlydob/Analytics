window.App = window.App || {};
App.Pages = App.Pages || {};
App.Pages.experiments = function(){
  const el = document.getElementById('view');
  el.innerHTML = `
    <section class="card">
      <div class="hint">Experimentos A/B</div>
      <div class="small">WIP (Sprint 4). Aquí marcarás periodos y presets.</div>
    </section>
  `;
};
