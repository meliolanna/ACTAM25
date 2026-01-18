// firebaseClient.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// INCOLLA QUI la tua config da Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyANYC7HAmS_ktgxiF5vH6D3M0rMTlyS-jk",
  authDomain: "beat-the-beat-9114f.firebaseapp.com",
  projectId: "beat-the-beat-9114f",
  storageBucket: "beat-the-beat-9114f.firebasestorage.app",
  messagingSenderId: "1039245631520",
  appId: "1:1039245631520:web:58b372b00ba688643edc45"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let signedIn = false;
export async function ensureAnonAuth() {
  if (signedIn) return;
  await signInAnonymously(auth);
  signedIn = true;
}
