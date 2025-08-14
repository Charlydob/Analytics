window.App = window.App || {};
App.Store = (()=>{
  const { dbRef } = App.Firebase;
  const { enqueue, drain, onNetworkRestore } = App.Queue;

  const state = { user:null, owner:false };

  function bootAuth(){
    return new Promise(res=>{
      firebase.auth().onAuthStateChanged(async u=>{
        if(!u){ await firebase.auth().signInAnonymously(); return; }
        state.user = u;
        state.owner = (u.uid === App.Config.OWNER_UID);
        if (state.owner) await ensureOwnerProfile(u.uid);
        res(u);
      });
    });
  }
  async function ensureOwnerProfile(uid){
    const snap = await dbRef(`users/${uid}`).get();
    if(!snap.exists()){
      await dbRef(`users/${uid}`).set({ role:'owner', createdAt: Date.now() });
    }
  }

  async function runWithQueue(exec, payload){
    try{ return await exec(); }
    catch(e){ await enqueue(payload); return { queued:true }; }
  }
  async function dbSet(path, value){ return runWithQueue(()=> dbRef(path).set(value), { kind:'set', path, value }); }
  async function dbUpdate(path, value){ return runWithQueue(()=> dbRef(path).update(value), { kind:'update', path, value }); }
  async function dbRemove(path){ return runWithQueue(()=> dbRef(path).remove(), { kind:'remove', path }); }

  function startQueueDrainer(){
    const executor = async (m)=>{
      if(m.kind==='set') return dbRef(m.path).set(m.value);
      if(m.kind==='update') return dbRef(m.path).update(m.value);
      if(m.kind==='remove') return dbRef(m.path).remove();
    };
    const tick = ()=> drain(executor);
    onNetworkRestore(tick);
    setInterval(()=> navigator.onLine && tick(), 5000);
  }

  return { state, bootAuth, dbSet, dbUpdate, dbRemove, startQueueDrainer };
})();
