import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBm77BRlMPzQixiJ3HnX9ueFS2HvXnPVa4",
  authDomain: "tournament-table-45dca.firebaseapp.com",
  projectId: "tournament-table-45dca",
  storageBucket: "tournament-table-45dca.firebasestorage.app",
  messagingSenderId: "762901573808",
  appId: "1:762901573808:web:48e52292299c0944894b75"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, limit };
