// Cola offline simple para set/update/remove con reintentos
const DB_NAME = 'ytlab-queue';
const STORE = 'mutations';
let idb;

function openIDB(){
  return new Promise((res, rej)=>{
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = ()=> r.result.createObjectStore(STORE, { keyPath:'id', autoIncrement:true });
    r.onerror = ()=> rej(r.error);
    r.onsuccess = ()=> res(r.result);
  });
}
async function tx(mode){ idb ||= await openIDB(); return idb.transaction(STORE, mode).objectStore(STORE); }

export async function enqueue(op){
  const store = await tx('readwrite'); store.add({ ...op, ts:Date.now() });
}

export async function drain(executor){
  const store = await tx('readwrite');
  const all = await new Promise(res=>{
    const req = store.getAll(); req.onsuccess = ()=> res(req.result);
  });
  for(const m of all){
    try{ await executor(m); store.delete(m.id); }
    catch(e){ /* mantener para próximo intento */ }
  }
}

export function onNetworkRestore(cb){
  window.addEventListener('online', cb);
}
