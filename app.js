// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFCT65NaUVuu1YYBkKZM693zX_fKM7-Io",
  authDomain: "sawa-82a09.firebaseapp.com",
  projectId: "sawa-82a09",
  storageBucket: "sawa-82a09.firebasestorage.app",
  messagingSenderId: "200029883618",
  appId: "1:200029883618:web:18059e0fa3127bf62f62bb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const loginView = document.getElementById("loginView");
const appView   = document.getElementById("appView");
const errorBox  = document.getElementById("error");

// Anmelden
document.getElementById("loginBtn").addEventListener("click", async () => {
  errorBox.textContent = "";
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    errorBox.textContent = "Anmeldung fehlgeschlagen: " + e.code;
    console.error(e);
  }
});

// Abmelden
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});

// Laeuft automatisch bei jedem Seitenaufruf und nach jedem Login/Logout
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    loginView.classList.remove("hidden");
    appView.classList.add("hidden");
    return;
  }

  // Profil anlegen, falls es noch nicht existiert
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      name:      user.displayName || "",
      email:     user.email || "",
      photoURL:  user.photoURL || "",
      rolle:     "nutzer",          // spaeter: "admin" fuer dich
      erstelltAm: serverTimestamp()
    });
  }

  document.getElementById("name").textContent  = user.displayName || "Willkommen";
  document.getElementById("email").textContent = user.email || "";
  document.getElementById("photo").src         = user.photoURL || "";

  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
});
