// Firebase compat init (pegada ligera)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";

const FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  databaseURL: "https://TU_PROYECTO-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "XXX",
  appId: "1:XXX:web:YYY"
};

export const OWNER_UID = "PON_AQUI_TU_UID";

export const app = initializeApp(FIREBASE_CONFIG);
export const db = getDatabase(app);
export const auth = getAuth(app);

export { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword };
