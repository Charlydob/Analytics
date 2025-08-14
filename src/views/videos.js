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

  ref.on('value',(s)=>{
    list.innerHTML = '';
    const data = s.val() || {};
    const items = Object.entries(data);
    if (!items.length) {
      list.innerHTML = `<div class="hint small">No hay vídeos todavía.</div>`;
    } else {
      items.reverse().forEach(([id, v])=>{
        const item = document.createElement('button');
        item.className='item';
        item.onclick = ()=> location.href = `./video.html?id=${id}`;
        item.innerHTML = `
          <img class="thumb" src="${v.thumb?.cloudinaryUrl||''}" alt="">
          <div style="text-align:left">
            <div>${v.title||'—'}</div>
            <div class="hint small">${v.publishedAt||''} · ${v.tags?.slice(0,3).join(' · ')||''}</div>
          </div>`;
        list.appendChild(item);
      });
    }
  },(err)=>{
    console.warn('RTDB read /videos denied:', err?.message||err);
    list.innerHTML = `<div class="hint small">Sin permiso para leer /videos. Ajusta OWNER_UID o reglas.</div>`;
  });
};

// Acción global para crear vídeo
window.App.Actions = window.App.Actions || {};
App.Actions.addVideo = async function(){
  const { dbSet } = App.Store;
  const id = 'v_' + Math.random().toString(36).slice(2,9);
  const base = {
    ownerUid: firebase.auth().currentUser?.uid || null,
    title:'Nuevo vídeo',
    ytId:'',
    publishedAt: new Date().toISOString().slice(0,10),
    thumb:{ cloudinaryUrl:'', w:0, h:0 },
    tags:[],
    durationSec:0,
    paramsTarget:{}, paramsJudge:{},
    metrics:{ snapshot:{}, totals:{} },
    experimentPreset:null,
    notes:'',
    createdAt: Date.now(), updatedAt: Date.now()
  };
  try { await dbSet(`videos/${id}`, base); toast('Vídeo creado'); }
  catch(e){ console.warn('Create video error:', e); toast('Guardado en cola/permisos.'); }
  location.href = `./video.html?id=${id}`;
};
