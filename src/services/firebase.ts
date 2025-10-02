import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA15G5THFo223t_HB-IkCg8_8GRqFTk1Ew",
  authDomain: "nccerp-b5f64.firebaseapp.com",
  projectId: "nccerp-b5f64",
  storageBucket: "nccerp-b5f64.firebasestorage.app",
  messagingSenderId: "381080955731",
  appId: "1:381080955731:web:bd4de92dfe9c6fab3e4fa6",
  measurementId: "G-2JPHEZG7B8"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const analytics: Analytics = getAnalytics(app);

export default app;