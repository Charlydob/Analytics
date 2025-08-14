import { toast } from '../ui.js';
import { dbSet } from '../store/store.js';

export function renderVideos(){
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

  document.getElementById('fabAdd').onclick = async ()=>{
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
    await dbSet(`videos/${id}`, base);
    toast('Vídeo creado');
    location.hash = `#/video?id=${id}`;
  };

  const list = document.getElementById('list');
  firebase.database().ref('videos').on('value', s=>{
    list.innerHTML = '';
    const data = s.val()||{};
    Object.entries(data).reverse().forEach(([id, v])=>{
      const item = document.createElement('button');
      item.className='item';
      item.onclick = ()=> location.hash = `#/video?id=${id}`;
      item.innerHTML = `
        <img class="thumb" src="${v.thumb?.cloudinaryUrl||''}" alt="">
        <div style="text-align:left">
          <div>${v.title||'—'}</div>
          <div class="hint small">${v.publishedAt||''} · ${v.tags?.slice(0,3).join(' · ')||''}</div>
        </div>
      `;
      list.appendChild(item);
    });
  });
}
