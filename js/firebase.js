import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, increment, where, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
	apiKey: "AIzaSyA4B_IVv30YWYuO2il3fbwRji6DuXLcT4Y",
	authDomain: "nayweb-dd8f1.firebaseapp.com",
	projectId: "nayweb-dd8f1",
	storageBucket: "nayweb-dd8f1.firebasestorage.app",
	messagingSenderId: "580117202575",
	appId: "1:580117202575:web:0921ed6fb8e46e7c2952fa",
	measurementId: "G-PMDKLE1EEX"
};
let db = null; let auth = null; let analytics = null;
try {
	const app = initializeApp(firebaseConfig);
	db = getFirestore(app);
	auth = getAuth(app);
	isSupported().then((supported) => { if (supported) analytics = getAnalytics(app); }).catch(() => {});
} catch (error) { console.warn("Firebase indisponível; a aplicação usa defaults.", error); }
export { db, auth, analytics, collection, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, increment, where, limit, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail };
