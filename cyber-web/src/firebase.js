import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";

// Swiftie Web App Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyACxn6M_3vg1X6NIMypPb8GthqXq6drimw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "swiftie-d0ea0.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "swiftie-d0ea0",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "swiftie-d0ea0.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "658364785258",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:658364785258:web:7d7d6524e5a4ea729be013",
  measurementId: "G-VP302Z407Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure provider for popup authentication
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Firebase Sign In Error", error);
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for Firebase Auth. Please add it in Firebase Console.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
};

export const signOut = () => fbSignOut(auth);
