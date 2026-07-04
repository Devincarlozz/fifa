// src/services/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app;
let auth;
let db;
let googleProvider;
let functions;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Force HTTP long-polling to bypass client-side network blocking (adblockers/shields)
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    googleProvider = new GoogleAuthProvider();
    functions = getFunctions(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { app, auth, db, googleProvider, functions, isFirebaseConfigured };
