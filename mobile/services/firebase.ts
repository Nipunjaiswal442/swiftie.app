import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as fbSignOut,
  getAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyACxn6M_3vg1X6NIMypPb8GthqXq6drimw',
  authDomain: 'swiftie-d0ea0.firebaseapp.com',
  projectId: 'swiftie-d0ea0',
  storageBucket: 'swiftie-d0ea0.firebasestorage.app',
  messagingSenderId: '658364785258',
  appId: '1:658364785258:web:7d7d6524e5a4ea729be013',
  measurementId: 'G-VP302Z407Q',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use AsyncStorage persistence on native, default on web
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const signOut = () => fbSignOut(auth);

/**
 * Sign in with a Google ID token (from expo-auth-session).
 * Returns Firebase user.
 */
export const signInWithGoogleCredential = async (idToken: string) => {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
};
