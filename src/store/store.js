import { auth } from '../firebase/init.js';
import { dbRef } from '../firebase/rtdb.js';
import { enqueue, drain, onNetworkRestore } from './offlineQueue.js';
import { OWNER_UID } from '../firebase/init.js';

export const store = {
  user:null,
  owner:false
};

export async function bootAuth(){
  return new Promise(res=>{
    firebase.auth().onAuthStateChanged(async u=>{
      if(!u){
        await firebase.auth().signInAnonymously();
        return;
      }
      store.user = u;
      store.owner = (u.uid === OWNER_UID);
      if (store.owner) await ensureOwnerProfile(u.uid);
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

/* Escribe con cola si offline */
async function runWithQueue(exec, payload){
  try{
    return await exec();
  }catch(e){
    await enqueue(payload);
    return { queued:true };
  }
}

export async function dbSet(path, value){
  const exec = ()=> dbRef(path).set(value);
  return runWithQueue(exec, { kind:'set', path, value });
}
export async function dbUpdate(path, value){
  const exec = ()=> dbRef(path).update(value);
  return runWithQueue(exec, { kind:'update', path, value });
}
export async function dbRemove(path){
  const exec = ()=> dbRef(path).remove();
  return runWithQueue(exec, { kind:'remove', path });
}

export function startQueueDrainer(){
  const executor = async (m)=>{
    if(m.kind==='set') return dbRef(m.path).set(m.value);
    if(m.kind==='update') return dbRef(m.path).update(m.value);
    if(m.kind==='remove') return dbRef(m.path).remove();
  };
  const tick = ()=> drain(executor);
  onNetworkRestore(tick);
  setInterval(()=> navigator.onLine && tick(), 5000);
}
