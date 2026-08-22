import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔥 REPLACE THIS OBJECT with YOUR Firebase config
// Go to Firebase Console > Project Settings > Your Web App > Config
const firebaseConfig = {
  apiKey: "AIzaSyBNJuP5EtDKfeAug0uymsol6bQ6N6ijFGA",
  authDomain: "vhitemaps.firebaseapp.com",
  projectId: "vhitemaps",
  storageBucket: "vhitemaps.firebasestorage.app",
  messagingSenderId: "180472439236",
  appId: "1:180472439236:web:9e51827ab14ba95cbc0491"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);