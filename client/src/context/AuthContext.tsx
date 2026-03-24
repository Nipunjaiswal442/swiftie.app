import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authenticateWithGoogle } from '../services/authService';
import { connectSocket, disconnectSocket } from '../config/socket';
import { signalManager } from '../crypto/SignalManager';
import { User } from '../types/user';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const data = await authenticateWithGoogle(idToken);
          setUser(data.user);

          connectSocket(idToken);
          await signalManager.initialize();
        } catch (error) {
          console.error('Auth sync error:', error);
        }
      } else {
        setUser(null);
        disconnectSocket();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    disconnectSocket();
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
