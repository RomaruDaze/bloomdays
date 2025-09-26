import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCRePwV7RrhZK6i5O9C5zAUIupec3gKNz0",
  authDomain: "bloom-days.firebaseapp.com",
  databaseURL:
    "https://bloom-days-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bloom-days",
  storageBucket: "bloom-days.firebasestorage.app",
  messagingSenderId: "975086362431",
  appId: "1:975086362431:web:8f7c4c40eb98e80f6bbd8a",
  measurementId: "G-BEK761RP1T",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
