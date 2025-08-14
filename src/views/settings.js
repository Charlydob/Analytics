window.App = window.App || {};
App.Pages = App.Pages || {};

App.Pages.settings = function(){
  const uidSpan = document.getElementById('uidSpan');
  const emailSpan = document.getElementById('emailSpan');
  const roleBadge = document.getElementById('roleBadge');
  const blockAnon = document.getElementById('blockAnon');
  const blockLogged = document.getElementById('blockLogged');

  // Pinta estado actual
  const u = firebase.auth().currentUser;
  const uid = u?.uid || '—';
  const isAnon = !!u && u.isAnonymous;
  uidSpan.textContent = uid;
  emailSpan.textContent = u?.email || (isAnon ? '(anónimo)' : '(sin email)');

  // Muestra/oculta bloques
  blockAnon.classList.toggle('hidden', !isAnon);
  blockLogged.classList.toggle('hidden', isAnon);

  // Carga rol
  (async ()=>{
    try{
      const s = await firebase.database().ref(`users/${uid}/role`).get();
      roleBadge.textContent = (s.exists() && s.val()==='owner') ? 'owner' : 'viewer';
    }catch{ roleBadge.textContent = 'viewer'; }
  })();

  // Handlers
  document.getElementById('btnConvertAnon')?.addEventListener('click', onConvertAnon);
  document.getElementById('btnLogin')?.addEventListener('click', onLogin);
  document.getElementById('btnLogout')?.addEventListener('click', onLogout);
  document.getElementById('btnExport').addEventListener('click', onExport);
  document.getElementById('btnImport').addEventListener('click', ()=> document.getElementById('imp').click());
  document.getElementById('imp').addEventListener('change', onImport);

  async function markOwner(uid){
    await firebase.database().ref(`users/${uid}`).set({ role:'owner', createdAt: Date.now() });
  }

async function onConvertAnon(){
  const em = document.getElementById('emConvert').value.trim();
  const pw = document.getElementById('pwConvert').value;
  if(!em || !pw || pw.length<6){ alert('Email y contraseña (≥6)'); return; }

  const u = firebase.auth().currentUser;
  if(!u){ alert('No hay sesión'); return; }

  try{
    // 1) Intento ideal: LINK (conserva UID)
    const cred = firebase.auth.EmailAuthProvider.credential(em, pw);
    await u.linkWithCredential(cred);
    const uid = firebase.auth().currentUser.uid;
    await firebase.database().ref(`users/${uid}`).set({ role:'owner', createdAt: Date.now() });
    alert('Cuenta creada y OWNER asignado (UID conservado).');
    location.reload();
  }catch(e){
    const code = e.code || '';
    const msg  = e.message || '';
    // 2) Fallback: si el proyecto no permite link (o exige verificación previa), creamos/iniciamos sesión con ese email
    const fallback = (code === 'auth/operation-not-allowed')
                  || (code === 'auth/admin-restricted-operation')
                  || /verify the new email/i.test(msg);

    if (!fallback){ alert('Error al convertir: '+msg); return; }

    try{
      // a) Intenta login (si ya existe el email)
      await firebase.auth().signInWithEmailAndPassword(em, pw);
    }catch(eLogin){
      if (eLogin.code === 'auth/user-not-found'){
        // b) Si no existe, créalo (UID nuevo)
        await firebase.auth().createUserWithEmailAndPassword(em, pw);
      } else {
        alert('Login falló: ' + (eLogin.message||eLogin)); return;
      }
    }

    // c) Marca OWNER al UID (nuevo o existente)
    const uid2 = firebase.auth().currentUser.uid;
    await firebase.database().ref(`users/${uid2}`).set({ role:'owner', createdAt: Date.now() });
    alert('Cuenta lista y OWNER asignado (UID nuevo).');
    location.reload();
  }
}



  async function onLogin(){
    const em = document.getElementById('emLogin').value.trim();
    const pw = document.getElementById('pwLogin').value;
    if(!em || !pw){ alert('Email y contraseña'); return; }
    try{
      await firebase.auth().signInWithEmailAndPassword(em, pw);
      const uid = firebase.auth().currentUser.uid;
      const s = await firebase.database().ref(`users/${uid}/role`).get();
      if(!s.exists()) await markOwner(uid);
      location.reload();
    }catch(e){
      if (e.code === 'auth/user-not-found') {
        try{
          await firebase.auth().createUserWithEmailAndPassword(em, pw);
          const uid = firebase.auth().currentUser.uid;
          await markOwner(uid);
          alert('Cuenta creada y OWNER asignado.');
          location.reload();
        }catch(e2){ alert('Error al crear: '+(e2.message||e2)); }
      } else {
        alert('Login error: ' + (e.message||e));
      }
    }
  }

  async function onLogout(){ await firebase.auth().signOut(); location.reload(); }

  async function onExport(){
    const s = await firebase.database().ref('/').once('value');
    const blob = new Blob([JSON.stringify(s.val()||{}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `backup-${Date.now()}.json`; a.click();
  }
  async function onImport(e){
    const file = e.target.files[0]; if(!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await firebase.database().ref('/').set(data);
    alert('Importado');
  }
};
