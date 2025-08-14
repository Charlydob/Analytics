import { PARAM_KEYS } from '../types.d.js';
import { dbUpdate, dbRemove } from '../store/store.js';
import { toast } from '../ui.js';
import { uploadToCloudinary } from '../cloudinary/upload.js';

export function renderVideoDetail({ id }){
  const root = document.getElementById('view');
  if(!id){ root.innerHTML = `<div class="center hint">Falta id</div>`; return; }

  const vRef = firebase.database().ref(`videos/${id}`);

  vRef.once('value').then(s=>{
    const v = s.val();
    if(!v){ root.innerHTML = `<div class="center hint">No encontrado</div>`; return; }

    root.innerHTML = `
      <section class="card">
        <div class="row">
          <input id="title" class="input" value="${v.title||''}" />
          <input id="ytId" class="input" placeholder="YouTube ID" value="${v.ytId||''}" />
        </div>
        <div class="row">
          <input id="pub" class="input" type="date" value="${v.publishedAt||''}" />
          <input id="dur" class="input" type="number" placeholder="duración (s)" value="${v.durationSec||0}" />
        </div>
        <div class="row">
          <input id="tags" class="input" placeholder="etiquetas, separadas por coma" value="${(v.tags||[]).join(', ')}" />
        </div>

        <div class="subtabs">
          <button class="subtab active" data-t="metrics">Métricas</button>
          <button class="subtab" data-t="params">Parámetros</button>
          <button class="subtab" data-t="thumb">Miniatura</button>
          <button class="subtab" data-t="notes">Notas</button>
        </div>
        <div id="subview"></div>

        <hr/>
        <button id="btnDelete" class="btn" style="background:linear-gradient(180deg,#3b1d28,#2a1017)">Eliminar</button>
      </section>
    `;

    const saveBasic = async ()=>{
      const payload = {
        title: document.getElementById('title').value.trim(),
        ytId: document.getElementById('ytId').value.trim(),
        publishedAt: document.getElementById('pub').value,
        durationSec: +document.getElementById('dur').value||0,
        tags: document.getElementById('tags').value.split(',').map(x=>x.trim()).filter(Boolean),
        updatedAt: Date.now()
      };
      await dbUpdate(`videos/${id}`, payload);
      toast('Guardado');
    };
    ['title','ytId','pub','dur','tags'].forEach(k=>{
      document.getElementById(k).addEventListener('change', saveBasic);
    });

    document.getElementById('btnDelete').onclick = async ()=>{
      if(confirm('Eliminar vídeo?')){ await dbRemove(`videos/${id}`); toast('Eliminado'); history.back(); }
    };

    // Subtabs
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

    // --- MÉTRICAS ---
    function renderMetrics(){
      const x = v; // snapshot inicial
      const s24 = x.metrics?.snapshot?.['t+24h'] || {};
      const s7  = x.metrics?.snapshot?.['t+7d']  || {};
      const s30 = x.metrics?.snapshot?.['t+30d'] || {};
      const tot = x.metrics?.totals || {};

      subview.innerHTML = `
        <div class="grid2">
          <section class="card">
            <div class="hint">t+24h</div>
            ${metricInputs('t24', s24)}
          </section>
          <section class="card">
            <div class="hint">t+7d</div>
            ${metricInputs('t7', s7)}
          </section>
          <section class="card">
            <div class="hint">t+30d</div>
            ${metricInputs('t30', s30)}
          </section>
          <section class="card">
            <div class="hint">Totales</div>
            ${totalsInputs(tot)}
          </section>
        </div>
        <section class="card small">
          <div class="hint">Derivados (local)</div>
          <div class="kpi"><span>EngagementRate 24h</span><strong id="er24">—</strong></div>
          <div class="kpi"><span>EngagementRate 7d</span><strong id="er7">—</strong></div>
          <div class="kpi"><span>EngagementRate 30d</span><strong id="er30">—</strong></div>
        </section>
      `;

      hookSaves(id);
      computeDerived(); // inicial
    }

    function metricInputs(prefix, obj){
      const v = (k)=> obj?.[k] ?? '';
      return `
        <div class="row"><input id="${prefix}_views" class="input" type="number" placeholder="views" value="${v('views')}"></div>
        <div class="row"><input id="${prefix}_likes" class="input" type="number" placeholder="likes" value="${v('likes')}"></div>
        <div class="row"><input id="${prefix}_dislikes" class="input" type="number" placeholder="dislikes" value="${v('dislikes')??''}"></div>
        <div class="row"><input id="${prefix}_comments" class="input" type="number" placeholder="comments" value="${v('comments')}"></div>
        <div class="row"><input id="${prefix}_retentionPct" class="input" type="number" step="0.1" placeholder="retention % (opcional)" value="${v('retentionPct')??''}"></div>
        <div class="row"><input id="${prefix}_ctrPct" class="input" type="number" step="0.1" placeholder="CTR % (opcional)" value="${v('ctrPct')??''}"></div>
      `;
    }
    function totalsInputs(obj){
      const v = (k)=> obj?.[k] ?? '';
      return `
        <div class="row"><input id="tot_views" class="input" type="number" placeholder="views" value="${v('views')}"></div>
        <div class="row"><input id="tot_likes" class="input" type="number" placeholder="likes" value="${v('likes')}"></div>
        <div class="row"><input id="tot_dislikes" class="input" type="number" placeholder="dislikes" value="${v('dislikes')??''}"></div>
        <div class="row"><input id="tot_comments" class="input" type="number" placeholder="comments" value="${v('comments')}"></div>
      `;
    }

    function hookSaves(videoId){
      const map = {
        't24':'t+24h',
        't7':'t+7d',
        't30':'t+30d'
      };
      const inputs = subview.querySelectorAll('input');
      inputs.forEach(inp=>{
        inp.addEventListener('change', async ()=>{
          const idstr = inp.id;
          if(idstr.startsWith('tot_')){
            const key = idstr.replace('tot_','');
            const val = parseNum(inp.value);
            await dbUpdate(`videos/${videoId}/metrics/totals`, { [key]: val });
          } else {
            const [prefix, field] = idstr.split('_');
            const tkey = map[prefix];
            const val = parseNum(inp.value);
            await dbUpdate(`videos/${videoId}/metrics/snapshot/${tkey}`, { [field]: val });
          }
          toast('Métricas guardadas');
          computeDerived();
        });
      });
    }

    function parseNum(x){
      const n = (x==='' || x==null) ? null : +x;
      return Number.isFinite(n) ? n : null;
    }

    function computeDerived(){
      const g = (prefix)=> ({
        views: valNum(`${prefix}_views`),
        likes: valNum(`${prefix}_likes`),
        comments: valNum(`${prefix}_comments`)
      });
      const er = ({likes,comments,views})=>{
        if(!views) return '—';
        return (((likes||0)+(comments||0))/views*100).toFixed(2)+'%';
      };
      const v24 = g('t24'), v7 = g('t7'), v30 = g('t30');
      const set = (id, val)=>{ const el=document.getElementById(id); if(el) el.textContent = val; };
      set('er24', er(v24));
      set('er7', er(v7));
      set('er30', er(v30));
    }
    function valNum(id){ const el = document.getElementById(id); const n = +el?.value; return Number.isFinite(n)?n:0; }

    // --- PARÁMETROS (targets & judge) ---
    function renderParams(){
      subview.innerHTML = `
        <section class="card">
          <div class="hint">Targets (0–100)</div>
          ${sliderBlock('paramsTarget')}
        </section>
        <section class="card">
          <div class="hint">Judge (0–100)</div>
          ${sliderBlock('paramsJudge')}
        </section>
      `;
      wireSliders('paramsTarget');
      wireSliders('paramsJudge');
    }
    function sliderBlock(kind){
      return PARAM_KEYS.map(k=>{
        const val = (v[kind]?.[k] ?? 50);
        return `
          <div class="row" style="align-items:center">
            <label style="width:42%;">${k}</label>
            <input type="range" min="0" max="100" value="${val}" data-kind="${kind}" data-k="${k}" style="flex:1"/>
            <input type="number" min="0" max="100" value="${val}" data-kind="${kind}" data-k="${k}" class="input" style="width:64px"/>
          </div>
        `;
      }).join('');
    }
    function wireSliders(kind){
      subview.querySelectorAll(`[data-kind="${kind}"]`).forEach(el=>{
        const sync = (k, val)=>{
          subview.querySelectorAll(`[data-kind="${kind}"][data-k="${k}"]`).forEach(n=>{
            if(n!==el) n.value = val;
          });
        };
        el.addEventListener('input', e=>{
          const k = el.dataset.k; const val = clamp(e.target.value);
          sync(k, val);
        });
        el.addEventListener('change', async e=>{
          const k = el.dataset.k; const val = +clamp(e.target.value);
          await dbUpdate(`videos/${id}/${kind}`, { [k]: val });
          toast(`${kind==='paramsJudge'?'Judge':'Target'} · ${k}: ${val}`);
        });
      });
    }
    function clamp(v){ const n = Math.max(0, Math.min(100, +v||0)); return String(n); }

    // --- MINIATURA (Cloudinary) ---
    function renderThumb(){
      const url = v.thumb?.cloudinaryUrl || '';
      subview.innerHTML = `
        <section class="card">
          <div class="row" style="align-items:center; gap:12px">
            <img id="thumbPrev" class="thumb" src="${url}" alt="">
            <input id="thumbFile" type="file" accept="image/*" capture="environment" class="input" />
          </div>
          <div class="row">
            <button id="btnUpload" class="btn primary">Subir/Actualizar miniatura</button>
          </div>
        </section>
      `;
      document.getElementById('btnUpload').onclick = async ()=>{
        const f = document.getElementById('thumbFile').files?.[0];
        if(!f){ toast('Elige una imagen'); return; }
        try{
          const res = await uploadToCloudinary(f); // { secure_url, width, height }
          await dbUpdate(`videos/${id}/thumb`, { cloudinaryUrl: res.secure_url, w: res.width, h: res.height });
          document.getElementById('thumbPrev').src = res.secure_url;
          toast('Miniatura actualizada');
        }catch(e){
          toast('Error al subir miniatura');
        }
      };
    }

    // --- NOTAS ---
    function renderNotes(){
      const notes = v.notes || '';
      subview.innerHTML = `
        <section class="card">
          <textarea id="notes" class="input" rows="8" placeholder="Notas...">${notes}</textarea>
          <div class="row" style="margin-top:8px"><button id="saveNotes" class="btn">Guardar notas</button></div>
        </section>
      `;
      document.getElementById('saveNotes').onclick = async ()=>{
        const text = document.getElementById('notes').value.slice(0,2000);
        await dbUpdate(`videos/${id}`, { notes: text, updatedAt: Date.now() });
        toast('Notas guardadas');
      };
    }
  });
}
