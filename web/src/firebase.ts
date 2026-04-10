import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Public client-side config — safe to expose (Firebase security enforced by rules, not this key)
// Values come from Vercel env vars; hardcoded as fallback so the app never crashes with undefined
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyACxn6M_3vg1X6NIMypPb8GthqXq6drimw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'swiftie-d0ea0.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'swiftie-d0ea0',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'swiftie-d0ea0.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '658364785258',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:658364785258:web:7d7d6524e5a4ea729be013',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-VP302Z407Q',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const storage = getStorage(app)
