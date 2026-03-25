import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";

// Swiftie Web App Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACxn6M_3vg1X6NIMypPb8GthqXq6drimw",
  authDomain: "swiftie-d0ea0.firebaseapp.com",
  projectId: "swiftie-d0ea0",
  storageBucket: "swiftie-d0ea0.firebasestorage.app",
  messagingSenderId: "658364785258",
  appId: "1:658364785258:web:7d7d6524e5a4ea729be013",
  measurementId: "G-VP302Z407Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Firebase Sign In Error", error);
    throw error;
  }
};

export const signOut = () => fbSignOut(auth);
