import { store } from '../store/store.js';

export function renderSettings(){
  const el = document.getElementById('view');
  el.innerHTML = `
    <section class="card">
      <div>Usuario: <span class="badge">${store.user?.uid||'—'}</span></div>
      <div>Rol: <span class="badge">${store.owner?'owner':'viewer'}</span></div>
      <hr/>
      <button class="btn" id="btnExport">Export JSON</button>
      <input type="file" id="imp" accept=".json" style="display:none"/>
      <button class="btn" id="btnImport">Import JSON</button>
    </section>
  `;

  document.getElementById('btnExport').onclick = async ()=>{
    const s = await firebase.database().ref('/').once('value');
    const blob = new Blob([JSON.stringify(s.val()||{}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `backup-${Date.now()}.json`; a.click();
  };
  document.getElementById('btnImport').onclick = ()=> document.getElementById('imp').click();
  document.getElementById('imp').onchange = async e=>{
    const file = e.target.files[0]; if(!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await firebase.database().ref('/').set(data);
    alert('Importado');
  };
}
