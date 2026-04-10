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
 * Sign in with Google tokens from expo-auth-session.
 * Pass id_token and/or access_token (web sometimes returns only access_token).
 * Returns Firebase user — call user.getIdToken() for the backend (not the raw Google JWT).
 */
export const signInWithGoogleCredential = async (
  idToken?: string | null,
  accessToken?: string | null
) => {
  if (!idToken && !accessToken) {
    throw new Error('No Google id_token or access_token from sign-in');
  }
  const credential = GoogleAuthProvider.credential(
    idToken ?? undefined,
    accessToken ?? undefined
  );
  const result = await signInWithCredential(auth, credential);
  return result.user;
};
