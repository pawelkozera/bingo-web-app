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