import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA15G5THFo223t_HB-IkCg8_8GRqFTk1Ew",
  authDomain: "nccerp-b5f64.firebaseapp.com",
  projectId: "nccerp-b5f64",
  storageBucket: "nccerp-b5f64.firebasestorage.app",
  messagingSenderId: "381080955731",
  appId: "1:381080955731:web:bd4de92dfe9c6fab3e4fa6",
  measurementId: "G-2JPHEZG7B8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
