window.App = window.App || {};
App.Config = {
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyC3QMHB01hlEjr1jvAIRHKPaZ4xHpqNy7o",
    authDomain: "analytics-3c96e.firebaseapp.com",
    databaseURL: "https://analytics-3c96e-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "analytics-3c96e",
    storageBucket: "analytics-3c96e.appspot.com",
    messagingSenderId: "461195047232",
    appId: "1:461195047232:web:780139d7309de75dec8aa5"
  },
  OWNER_UID: "nFFeVqB6zldxGcMAVYNe9yc2tJR2",

  /* ← PON TUS DATOS DE CLOUDINARY */
  CLOUDINARY_CLOUD: "dgdavibcx",
  CLOUDINARY_PRESET: "publico"
};

if (!firebase.apps.length) firebase.initializeApp(App.Config.FIREBASE_CONFIG);

App.Firebase = {
  app: firebase.app(),
  auth: firebase.auth(),
  rtdb: firebase.database(),
  dbRef: (path)=> firebase.database().ref(path)
};
