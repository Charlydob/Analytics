window.App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.home = function(){
  const el = document.getElementById('view');
  el.innerHTML = `
    <section class="card">
      <div class="hint">KPIs</div>
      <div class="kpi"><span>Vídeos</span><strong id="kpiVideos">—</strong></div>
      <div class="kpi"><span>Vistas totales</span><strong id="kpiViews">—</strong></div>
    </section>
    <section class="card small hint">Consejo: añade tus primeros vídeos desde “Vídeos”.</section>
  `;
  firebase.database().ref('videos').once('value').then(s=>{
    const v = s.val() || {};
    document.getElementById('kpiVideos').textContent = Object.keys(v).length;
    const total = Object.values(v).reduce((a,x)=> a + (x.metrics?.totals?.views||0), 0);
    document.getElementById('kpiViews').textContent = total;
  }).catch(()=>{
    el.insertAdjacentHTML('beforeend','<section class="card small">Sin permiso para leer KPIs.</section>');
  });
};
