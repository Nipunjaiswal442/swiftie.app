import { create } from 'zustand';
import { exchangeFirebaseToken, storage, TOKEN_KEY, USER_KEY } from '../services/api';
import { signOut as fbSignOut } from '../services/firebase';
import { initUserKeys, loadKeys } from '../services/encryption';
import { uploadPreKeys } from '../services/api';
import { router } from 'expo-router';

interface User {
  _id: string;
  displayName: string;
  username: string;
  email: string;
  bio?: string;
  profilePhotoUrl?: string;
  followers?: string[];
  following?: string[];
  postsCount?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (firebaseIdToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  loadStoredAuth: async () => {
    try {
      const token = await storage.get(TOKEN_KEY);
      const userStr = await storage.get(USER_KEY);
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (firebaseIdToken: string) => {
    set({ isLoading: true });
    try {
      const { token, user } = await exchangeFirebaseToken(firebaseIdToken);
      await storage.set(TOKEN_KEY, token);
      await storage.set(USER_KEY, JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });

      // Initialize E2E keys for the user
      try {
        const publicKeyB64 = await initUserKeys(user._id);
        await uploadPreKeys({ identityKey: publicKeyB64 });
      } catch (err) {
        console.warn('Key init failed (non-critical):', err);
      }

      router.replace('/(tabs)/feed');
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await fbSignOut();
    } catch { /* ignore */ }
    await storage.remove(TOKEN_KEY);
    await storage.remove(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
    router.replace('/welcome');
  },
}));
