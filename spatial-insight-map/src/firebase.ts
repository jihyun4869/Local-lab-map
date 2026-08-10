import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6YRZMVAvfKHLChCXWl_hj8WuVsvOnCJk",
  authDomain: "spatial-insight-map.firebaseapp.com",
  projectId: "spatial-insight-map",
  storageBucket: "spatial-insight-map.firebasestorage.app",
  messagingSenderId: "756526104240",
  appId: "1:756526104240:web:8bb12a64ff51372776c575"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
