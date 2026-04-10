import { useCallback, useEffect, useMemo, useState } from "react";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Custom auth hook required by ConvexProviderWithAuth
// Bridges Firebase Auth → Convex authentication
export function useFirebaseAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const user = auth.currentUser;
      if (!user) return null;
      return getIdToken(user, forceRefreshToken);
    },
    []
  );

  return useMemo(
    () => ({ isLoading, isAuthenticated, fetchAccessToken }),
    [isLoading, isAuthenticated, fetchAccessToken]
  );
}
