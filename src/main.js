import { initRouter } from './router.js';
import { toast } from './ui.js';
import { bootAuth, startQueueDrainer } from './store/store.js';

if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js'); }

window.addEventListener('load', ()=>{
  document.getElementById('fabAdd').style.display = 'block';
});

(async function boot(){
  // Cargar SDK compat global para rtdb en paralelo (necesario para firebase.* usos directos)
  const s1 = document.createElement('script');
  s1.type='module';
  s1.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
  const s2 = document.createElement('script'); s2.type='module'; s2.src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js";
  const s3 = document.createElement('script'); s3.type='module'; s3.src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";
  document.head.append(s1,s2,s3);

  await bootAuth();
  startQueueDrainer();
  initRouter();
  toast('Listo');
})();
