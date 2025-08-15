window.App = window.App || {};
App.Pages = App.Pages || {};
const TKEYS = ["gancho","claridad","flujo","originalidad","enganche","ejemplos","lirismo","variedad","bucles","ritmo","cierre"];
const _toast = (m)=> App.UI.toast(m);

App.Pages.videoDetail = function(params){
  const id = params.id || new URL(location.href).searchParams.get('id');
  const root = document.getElementById('view');
  if(!id){ root.innerHTML = `<div class="center hint">Falta id</div>`; return; }

  root.innerHTML = `<section class="card"><div class="hint">Cargando…</div></section>`;
  const vRef = firebase.database().ref(`videos/${id}`);

  vRef.once('value').then(s=>{
    const v = s.val();
    if(!v){ root.innerHTML = `<div class="center hint">No encontrado</div>`; return; }

    root.innerHTML = `
      <section class="card">
        <div class="row" style="gap:8px">
          <input id="title" class="input" value="${v.title||''}" />
        </div>
        <div class="row-tight" style="gap:8px">
          <input id="ytUrl" class="input" placeholder="Pega enlace de YouTube" />
        </div>
        <div class="row-tight" style="gap:8px">
          <input id="ytId" class="input" placeholder="ID" value="${v.ytId||''}" />
        </div>
        <div class="row-tight" style="gap:8px">
          <input id="pub" class="input" type="date" value="${(v.publishedAt||'').slice(0,10)}" />
        </div>
        <div class="row-tight" style="gap:8px">
          <input id="dur" class="input" type="number" inputmode="decimal" placeholder="0" value="${v.durationSec||0}" />
        </div>

        <div class="subtabs" style="margin-top:8px">
          <button class="subtab active" data-t="metrics">Métricas</button>
          <button class="subtab" data-t="params">Parámetros</button>
          <button class="subtab" data-t="thumb">Miniatura</button>
          <button class="subtab" data-t="notes">Notas</button>
        </div>
        <div id="subview"></div>

        <hr/>
        <div class="row">
          <a class="btn" href="./videos.html">Volver</a>
          <button id="btnDelete" class="btn" style="background:linear-gradient(180deg,#3b1d28,#2a1017)">Eliminar</button>
        </div>
      </section>
    `;

    // ---------- Helpers de redondeo ----------
    const r2 = (x)=> {
      const n = +x;
      return Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : null;
    };
    const show2 = (x)=> x===''||x==null ? '' : String(r2(x));
    const numOrNullR2 = (x)=> {
      if(x==='' || x==null) return null;
      const n = r2(x);
      return Number.isFinite(n) ? n : null;
    };

    // ---------- Guardado básico ----------
    const saveBasic = async ()=>{
      const payload = {
        title: document.getElementById('title').value.trim(),
        ytId: (App.YTUtil && App.YTUtil.parseId(document.getElementById('ytId').value.trim())) || '',
        publishedAt: document.getElementById('pub').value,
        durationSec: numOrNullR2(document.getElementById('dur').value)||0,
        updatedAt: Date.now()
      };
      // normaliza visualmente duración
      document.getElementById('dur').value = show2(payload.durationSec);
      await App.Store.dbUpdate(`videos/${id}`, payload);
      _toast('Guardado');
    };
    ['title','ytId','pub','dur'].forEach(k=> document.getElementById(k).addEventListener('change', saveBasic));

    // URL → ID auto + guardado
    const ytUrlEl = document.getElementById('ytUrl');
    ytUrlEl.addEventListener('input', async (e)=>{
      const parsed = (App.YTUtil && App.YTUtil.parseId(e.target.value.trim())) || '';
      if(parsed){
        const idEl = document.getElementById('ytId');
        idEl.value = parsed;
        idEl.dispatchEvent(new Event('change', { bubbles:true }));
        _toast('ID detectado: '+parsed);
      }
    });

    // ---------- Borrar ----------
    document.getElementById('btnDelete').onclick = async ()=>{
      if(confirm('Eliminar vídeo?')){ await App.Store.dbRemove(`videos/${id}`); _toast('Eliminado'); location.href='./videos.html'; }
    };

    // ---------- Subtabs ----------
    const subview = document.getElementById('subview');
    const setActive = (t)=>{
      document.querySelectorAll('.subtab').forEach(b=>b.classList.toggle('active', b.dataset.t===t));
      if(t==='metrics') renderMetrics();
      if(t==='params') renderParams();
      if(t==='thumb') renderThumb();
      if(t==='notes') renderNotes();
    };
    document.querySelectorAll('.subtab').forEach(b=> b.onclick = ()=> setActive(b.dataset.t));
    setActive('metrics');

    // ---------- Métricas ----------
// ---------- Métricas (tabla compacta) ----------
function renderMetrics(){
  const x = v;
  const s24 = x.metrics?.snapshot?.['t+24h'] || {};
  const s7  = x.metrics?.snapshot?.['t+7d']  || {};
  const s30 = x.metrics?.snapshot?.['t+30d'] || {};
  const tot = x.metrics?.totals || {};

  const cells = {
    views:        { label:'Vistas' },
    likes:        { label:'Likes' },
    dislikes:     { label:'Dislikes' },
    comments:     { label:'Com' },
    retentionPct: { label:'Ret%', noTotals:true },
    ctrPct:       { label:'CTR %',       noTotals:true }
  };
  const get = (o,k)=> show2(o?.[k]);

  let rows = '';
  Object.entries(cells).forEach(([k, meta])=>{
    rows += `
      <tr>
        <th class="kpi">${meta.label}</th>
        <td class="num">${inputCell('t24', k, get(s24,k))}</td>
        <td class="num">${inputCell('t7',  k, get(s7,k))}</td>
        <td class="num">${inputCell('t30', k, get(s30,k))}</td>
        <td class="num">${meta.noTotals ? '<span class="hint">—</span>' : inputCell('tot', k, get(tot,k))}</td>
      </tr>`;
  });

  subview.innerHTML = `
    <section class="card">
      <div class="hint">Métricas (24h / 7d / 30d / Totales)</div>
      <div class="mtable-wrap" role="region" aria-label="Tabla de métricas" tabindex="0">
        <table class="mtable">
          <thead>
            <tr>
              <th class="left">KPI</th>
              <th>24h</th><th>7d</th><th>30d</th><th>Totales</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <th class="kpi">Eng%</th>
              <td class="num"><span id="eng_t24">—</span></td>
              <td class="num"><span id="eng_t7">—</span></td>
              <td class="num"><span id="eng_t30">—</span></td>
              <td class="num"><span class="hint">—</span></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  `;
  hookSavesTable(id);
  computeDerivedTable();
}

function inputCell(col, key, val){
  return `<input
    id="${col}_${key}"
    data-col="${col}"
    data-key="${key}"
    class="input mcell"
    type="number"
    inputmode="decimal"
    step="0.01"
    value="${val??''}"
  />`;
}
function hookSavesTable(videoId){
  const map = { t24:'t+24h', t7:'t+7d', t30:'t+30d' };
  subview.querySelectorAll('.mcell').forEach(inp=>{
    inp.addEventListener('input', computeDerivedTable);
    inp.addEventListener('change', async ()=>{
      inp.value = show2(inp.value);
      const col = inp.dataset.col, key = inp.dataset.key;
      const val = numOrNullR2(inp.value);
      if (col === 'tot')
        await App.Store.dbUpdate(`videos/${videoId}/metrics/totals`, { [key]: val });
      else
        await App.Store.dbUpdate(`videos/${videoId}/metrics/snapshot/${map[col]}`, { [key]: val });
      _toast('Métricas guardadas');
      computeDerivedTable();
    });
  });
}
function computeDerivedTable(){
  ['t24','t7','t30'].forEach(c=>{
    const views = +getVal(`${c}_views`);
    const likes = +getVal(`${c}_likes`);
    const comms = +getVal(`${c}_comments`);
    const eng   = !views ? '—' : (r2(((likes+comms)/views)*100)).toFixed(2)+'%';
    const el = document.getElementById(`eng_${c}`); if (el) el.textContent = eng;
  });
}
function getVal(id){
  const el = document.getElementById(id);
  const n = +el?.value;
  return Number.isFinite(n) ? n : 0;
}


    // ---------- Parámetros ----------
    function renderParams(){
      subview.innerHTML = `
        <section class="card"><div class="hint">Targets (0–100)</div>${sliderBlock('paramsTarget')}</section>
        <section class="card"><div class="hint">Judge (0–100)</div>${sliderBlock('paramsJudge')}</section>
      `;
      wireSliders('paramsTarget'); wireSliders('paramsJudge');
    }
    function sliderBlock(kind){
      return TKEYS.map(k=>{
        const val = (v[kind]?.[k] ?? 50);
        return `
          <div class="row-tight" style="align-items:center;gap:8px">
            <label style="width:42%">${k}</label>
            <input type="range" min="0" max="100" value="${val}" data-kind="${kind}" data-k="${k}" style="flex:1"/>
            <input type="number" min="0" max="100" inputmode="decimal" value="${val}" data-kind="${kind}" data-k="${k}" class="input" style="width:64px"/>
          </div>
        `;
      }).join('');
    }
    function wireSliders(kind){
      subview.querySelectorAll(`[data-kind="${kind}"]`).forEach(el=>{
        const sync = (k, val)=> subview.querySelectorAll(`[data-kind="${kind}"][data-k="${k}"]`).forEach(n=>{ if(n!==el) n.value = val; });
        el.addEventListener('input', e=>{
          const k=el.dataset.k; const valStr=e.target.value; const val=String(Math.max(0, Math.min(100, +valStr||0)));
          sync(k,val);
        });
        el.addEventListener('change', async e=>{
          const k=el.dataset.k; const vNum = r2(e.target.value); // redondeo 2 dec.
          const val = Math.max(0, Math.min(100, vNum||0));
          // Normaliza visualmente
          subview.querySelectorAll(`[data-kind="${kind}"][data-k="${k}"]`).forEach(n=> n.value = String(val));
          await App.Store.dbUpdate(`videos/${id}/${kind}`, { [k]: val });
          _toast(`${kind==='paramsJudge'?'Judge':'Target'} · ${k}: ${val}`);
        });
      });
    }

    // ---------- Miniatura ----------
    function renderThumb(){
      const url = v.thumb?.cloudinaryUrl || '';
      subview.innerHTML = `
        <section class="card">
          <div class="row" style="align-items:center; gap:12px">
            <img id="thumbPrev" class="thumb" src="${url}" alt="">
            <input id="thumbFile" type="file" accept="image/*" capture="environment" class="input" />
          </div>
          <div class="row"><button id="btnUpload" class="btn primary">Subir/Actualizar miniatura</button></div>
        </section>
      `;
      document.getElementById('btnUpload').onclick = async ()=>{
        const f = document.getElementById('thumbFile').files?.[0];
        if(!f){ _toast('Elige una imagen'); return; }
        try{
          const CLOUD = App.Config.CLOUDINARY_CLOUD;
          const PRESET = App.Config.CLOUDINARY_PRESET;
          const urlUp = `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`;
          const fd = new FormData(); fd.append('upload_preset', PRESET); fd.append('file', f);
          const r = await fetch(urlUp, { method:'POST', body: fd });
          if(!r.ok) throw new Error('Cloudinary upload failed');
          const res = await r.json();
          await App.Store.dbUpdate(`videos/${id}/thumb`, { cloudinaryUrl: res.secure_url, w: res.width, h: res.height });
          document.getElementById('thumbPrev').src = res.secure_url;
          _toast('Miniatura actualizada');
        }catch(e){ _toast('Error al subir miniatura'); }
      };
    }

    // ---------- Notas ----------
    function renderNotes(){
      const notes = v.notes || '';
      subview.innerHTML = `
        <section class="card">
          <label style="margin-bottom:6px;display:block">Notas</label>
          <textarea id="notes" class="input" rows="8" placeholder="Notas...">${notes}</textarea>
          <div class="row" style="margin-top:8px"><button id="saveNotes" class="btn">Guardar notas</button></div>
        </section>
      `;
      document.getElementById('saveNotes').onclick = async ()=>{
        const text = document.getElementById('notes').value.slice(0,2000);
        await App.Store.dbUpdate(`videos/${id}`, { notes: text, updatedAt: Date.now() });
        _toast('Notas guardadas');
      };
    }
  }).catch(()=>{
    root.innerHTML = `<section class="card small">Sin permiso para leer este vídeo o no existe.</section>`;
  });
};
