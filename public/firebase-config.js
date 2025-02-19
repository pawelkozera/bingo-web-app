// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDfRBR9NGB5f8GT1ndgAvvGbuTmW3lgPyA",
    authDomain: "bingo-40cba.firebaseapp.com",
    projectId: "bingo-40cba",
    storageBucket: "bingo-40cba.firebasestorage.app",
    messagingSenderId: "439731568255",
    appId: "1:439731568255:web:d5c3e1eab04e48813bc94a",
    measurementId: "G-8YG9E7QF2N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set auth persistence
await setPersistence(auth, browserLocalPersistence);

// Streamer configuration
export const STREAMER_NAME = "je1lybeann";  // Replace if needed

// firebase-config.js 
export const store = {
    _state: {
      username: null,
      userData: null,
      alert_bingo_time: 7,
      grid_rows: 5,
      grid_columns: 5
    },
    listeners: [],
    
    setState(newState) {
      this._state = {...this._state, ...newState};
      this.listeners.forEach(listener => listener(this._state));
      // Sync z localStorage
      localStorage.setItem('bingoStore', JSON.stringify(this._state));
    },
    
    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }
  };
  
  // Inicjalizacja z localStorage
  const savedState = localStorage.getItem('bingoStore');
  if (savedState) {
    store._state = JSON.parse(savedState);
  }
  
  // Nasłuchuj zmiany w localStorage między zakładkami
  window.addEventListener('storage', (event) => {
    if (event.key === 'bingoStore') {
      store.setState(JSON.parse(event.newValue));
    }
});

// Auth check helper
export function initAuthCheck() {
    onAuthStateChanged(auth, (user) => {
        if (!user) window.location.href = 'login.html';
    });
}

export function initSingInAnonymously() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is already logged in");
        } else {
            // Only sign in anonymously if no user is logged in
            signInAnonymously(auth).then(() => {
                console.log("OBS Authenticated anonymously");
            }).catch((error) => {
                console.error("Anonymous auth failed:", error);
            });
        }
    });
}