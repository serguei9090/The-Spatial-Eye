"use client";

import {
  GoogleAuthProvider,
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

import { getFirebaseServices, hasFirebaseConfig } from "@/lib/firebase/config";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setError("Missing Firebase configuration.");
      setIsLoading(false);
      return;
    }

    const { auth } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      },
      (authError) => {
        setError(authError.message);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      signInWithGoogle: async () => {
        const { auth } = getFirebaseServices();
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      },
      signOutUser: async () => {
        const { auth } = getFirebaseServices();
        await signOut(auth);
      },
      getIdToken: async () => {
        if (!user) {
          return null;
        }
        return user.getIdToken();
      },
    }),
    [error, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
