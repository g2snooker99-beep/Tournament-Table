import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBm77BRlMPzQixiJ3HnX9ueFS2HvXnPVa4",
  authDomain: "tournament-table-45dca.firebaseapp.com",
  projectId: "tournament-table-45dca",
  storageBucket: "tournament-table-45dca.firebasestorage.app",
  messagingSenderId: "762901573808",
  appId: "1:762901573808:web:48e52292299c0944894b75"
};

const app = initializeApp(firebaseConfig);
console.log("Firebase initialized successfully");

export { db, collection, addDoc, getDoc, getDocs, updateDoc, doc, query, where, onSnapshot, orderBy, limit };
