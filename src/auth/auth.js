import { store } from '../store/store.js';

export function requireOwner(){
  if(!store.owner) throw new Error('No autorizado');
}
