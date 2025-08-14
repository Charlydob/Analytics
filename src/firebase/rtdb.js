// src/firebase/rtdb.js
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js";
import { app } from './init.js';

const rtdb = getDatabase(app);

export const dbRef = (path) => rtdb.ref(path);
