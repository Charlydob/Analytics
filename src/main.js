(function(){
  // SW en prod; sin SW en localhost
  const isDev = ['localhost','127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator) {
    if (!isDev) {
      const BASE = location.pathname.replace(/[^/]*$/, '');
      navigator.serviceWorker.register(`${BASE}service-worker.js`, { scope: BASE }).catch(console.error);
    } else {
      navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
      if (window.caches) caches.keys().then(keys=>keys.forEach(k=>caches.delete(k)));
    }
  }

  window.addEventListener('DOMContentLoaded', boot);

  async function boot(){
    try { await App.Store.bootAuth(); } catch(e){ console.error('Auth', e); }
    App.Store.startQueueDrainer();

    const page = document.body.getAttribute('data-page');
    if (page && App.Pages && typeof App.Pages[page] === 'function') {
      App.Pages[page]({});
    }

    const fab = document.getElementById('fabAdd');
    if (fab) { fab.onclick = openCreateVideoModal; fab.style.display = 'block'; }
    App.UI.toast('Listo');
  }

  const PARAM_KEYS = ["gancho","claridad","flujo","originalidad","enganche","ejemplos","lirismo","variedad","bucles","ritmo","cierre"];

  // ---- Modal crear vídeo ----
  window.openCreateVideoModal = function(){
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `
      <div class="sheet">
        <div class="header">
          <h3>Nuevo vídeo</h3>
          <button id="mClose" class="btn">Cerrar</button>
        </div>

        <div class="section">
          <div class="row"><input id="m_title" class="input" placeholder="Título *" /></div>
          <div class="row-tight">
            <input id="m_yt" class="input" placeholder="YouTube ID (opcional)" />
            <input id="m_date" class="input" type="date" />
          </div>
          <div class="row-tight">
            <input id="m_dur" class="input" type="number" placeholder="duración (s)" />
            <input id="m_tags" class="input" placeholder="etiquetas, separadas por coma" />
          </div>
        </div>

        <div class="section">
          <div class="hint">Miniatura (Cloudinary unsigned)</div>
          <div class="row-tight"><input id="m_thumb" class="input" type="file" accept="image/*" /></div>
        </div>

        <div class="section">
          <div class="hint">Targets (0–100)</div>
          ${PARAM_KEYS.map(k=>`
            <div class="rangeRow">
              <label>${k}</label>
              <input type="range" min="0" max="100" value="50" data-kind="t" data-k="${k}" style="flex:1"/>
              <input type="number" min="0" max="100" value="50" data-kind="t" data-k="${k}" class="input" style="width:64px"/>
            </div>`).join('')}
        </div>

        <div class="section">
          <div class="hint">Judge (0–100)</div>
          ${PARAM_KEYS.map(k=>`
            <div class="rangeRow">
              <label>${k}</label>
              <input type="range" min="0" max="100" value="50" data-kind="j" data-k="${k}" style="flex:1"/>
              <input type="number" min="0" max="100" value="50" data-kind="j" data-k="${k}" class="input" style="width:64px"/>
            </div>`).join('')}
        </div>

        <div class="actions">
          <button id="mCreate" class="btn primary" style="flex:1">Crear</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);

    document.getElementById('m_date').value = new Date().toISOString().slice(0,10);
    m.querySelectorAll('input[data-kind]').forEach(el=>{
      el.addEventListener('input', ()=>{
        const kind = el.dataset.kind, k = el.dataset.k, val = clamp(el.value);
        m.querySelectorAll(`input[data-kind="${kind}"][data-k="${k}"]`).forEach(n=>{ if(n!==el) n.value = val; });
      });
    });
    document.getElementById('mClose').onclick = ()=> m.remove();
    document.getElementById('mCreate').onclick = ()=> doCreate(m);
  };

  function clamp(v){ const n = Math.max(0, Math.min(100, +v||0)); return String(n); }

  async function doCreate(m){
    const title = document.getElementById('m_title').value.trim();
    if(!title){ App.UI.toast('Pon un título'); return; }

    const ytId = document.getElementById('m_yt').value.trim();
    const publishedAt = document.getElementById('m_date').value;
    const durationSec = +document.getElementById('m_dur').value || 0;
    const tags = document.getElementById('m_tags').value.split(',').map(x=>x.trim()).filter(Boolean);

    const paramsTarget = {}, paramsJudge  = {};
    document.querySelectorAll('[data-kind="t"]').forEach(el=> paramsTarget[el.dataset.k] = +clamp(el.value));
    document.querySelectorAll('[data-kind="j"]').forEach(el=> paramsJudge[el.dataset.k] = +clamp(el.value));

    // Subida Cloudinary (si hay archivo)
    let thumb = { cloudinaryUrl:'', w:0, h:0 };
    const file = document.getElementById('m_thumb').files?.[0];
    if (file && App.Config.CLOUDINARY_CLOUD && App.Config.CLOUDINARY_PRESET) {
      try{
        const url = `https://api.cloudinary.com/v1_1/${App.Config.CLOUDINARY_CLOUD}/image/upload`;
        const fd = new FormData();
        fd.append('upload_preset', App.Config.CLOUDINARY_PRESET);
        fd.append('file', file);
        const r = await fetch(url, { method:'POST', body: fd });
        if(r.ok){
          const j = await r.json();
          thumb = { cloudinaryUrl: j.secure_url, w: j.width||0, h: j.height||0 };
        } else { App.UI.toast('Cloudinary falló, continuo sin miniatura'); }
      }catch{ App.UI.toast('Cloudinary falló, continuo sin miniatura'); }
    }

    const id = 'v_' + Math.random().toString(36).slice(2,9);
    const base = {
      ownerUid: firebase.auth().currentUser?.uid || null,
      title, ytId, publishedAt,
      thumb, tags, durationSec,
      paramsTarget, paramsJudge,
      metrics:{ snapshot:{}, totals:{} },
      experimentPreset:null, notes:'',
      createdAt: Date.now(), updatedAt: Date.now()
    };

    try{
      await App.Store.dbSet(`videos/${id}`, base);
      App.UI.toast('Creado');
    }catch(e){
      console.warn('Create en cola/permisos:', e);
      App.UI.toast('Guardado en cola (offline/permisos)');
    }
    m.remove();
    location.href = `./video.html?id=${id}`;
  }
})();
