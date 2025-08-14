window.App = window.App || {};
App.Pages = App.Pages || {};
const toast = (m)=> App.UI.toast(m);

App.Pages.videos = function(){
  const el = document.getElementById('view');
  el.innerHTML = `
    <section class="card">
      <div class="row">
        <input id="search" class="input" placeholder="Buscar título o etiqueta" />
        <select id="filterPreset"><option value="">Preset</option></select>
      </div>
      <hr/>
      <div id="list" class="list"></div>
    </section>
  `;

  const list = document.getElementById('list');
  const ref = firebase.database().ref('videos');

  // Carga inmediata (snapshot único)
  ref.once('value').then(s=>{
    renderList(s.val()||{});
  }).catch(err=>{
    list.innerHTML = `<div class="hint small">No puedo leer /videos: ${err?.code||'permiso'}</div>`;
  });

  // Suscripción en tiempo real
  ref.on('value',(s)=> renderList(s.val()||{}),
    (err)=>{
      console.warn('RTDB read /videos denied:', err?.message||err);
      list.innerHTML = `<div class="hint small">
        Sin permiso para leer /videos.<br/>
        Ve a <b>Ajustes</b> y usa <b>Iniciar sesión / Crear cuenta</b> (se marcará OWNER).
      </div>`;
    }
  );

  function renderList(data){
    list.innerHTML = '';
    const items = Object.entries(data);
    if (!items.length) {
      list.innerHTML = `<div class="hint small">No hay vídeos todavía.</div>`;
      return;
    }
    items.reverse().forEach(([id, v])=>{
      const item = document.createElement('button');
      item.className='item';
      item.onclick = ()=> location.href = `./video.html?id=${id}`;
      const t = (v.tags||[]).slice(0,3).join(' · ');
      item.innerHTML = `
        <img class="thumb" src="${v.thumb?.cloudinaryUrl||''}" alt="">
        <div style="text-align:left">
          <div>${v.title||'—'}</div>
          <div class="hint small">${v.publishedAt||''} · ${t}</div>
        </div>`;
      list.appendChild(item);
    });
  }
};
