import { firebaseConfig } from './firebase-config.js';

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const bingoCard = document.getElementById("bingo-card");

// Listen for changes in Firestore
db.collection("bingo").doc("alert").onSnapshot((doc) => {
    const data = doc.data();
    if (data.showCard) {
        showBingoCard();
        setTimeout(hideBingoCard, 5000); // Hide after 5 seconds
        db.collection("bingo").doc("alert").update({ showCard: false }); // Reset flag
    }
});

function showBingoCard() {
    bingoCard.classList.add("visible");
}

function hideBingoCard() {
    bingoCard.classList.remove("visible");
}