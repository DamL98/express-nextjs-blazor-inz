"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ApiClientError, apiRequest } from "@/lib/api";
import { API_URL } from "@/lib/config/env";

// profil konta Google zapisany w bazie aplikacji
// backend zwraca go po zweryfikowaniu sesji użytkownika
export type LocalUser = {
  id: string;
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  role: { name: string };
};

// stan uwierzytelnienia udostępniany komponentom wewnatrz providera
type AuthContext = {
  user: LocalUser | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

// uzycie null pozwala wykryć użycie useAuth poza AuthProvider
const AuthContext = createContext<AuthContext | null>(null);

async function getCurrentSessionUser(signal?: AbortSignal) {
  return apiRequest<LocalUser>("/auth/me", {
    cache: "no-store",
    signal,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("api-session-expired", expire);
    return () => window.removeEventListener("api-session-expired", expire);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // Backend odtwarza usera na podstawie cookie session
    getCurrentSessionUser(controller.signal)
      .then((currentUser) => {
        if (!controller.signal.aborted) {
          setUser(currentUser);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) setUser(null);
        else setError("Nie mozna sprawdzic sesji. Odswiez strone i sprobuj ponownie.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/login`;
    const url = new URL(`${API_URL}/auth/google/start`);

    url.searchParams.set("redirectTo", redirectTo);
    window.location.assign(url.toString());
  }, []);

  // backend usuwa cookie session
  const logout = useCallback(async () => {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
    setUser(null);
  }, []);

  // zachowuje referencję kontekstu, dopóki nie zmieni się jego stan
  const value = useMemo(
    () => ({ user, loading, error, loginWithGoogle, logout }),
    [user, loading, error, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// udostępnia stan uwierzytelnienia wyłącznie wewnątrz AuthProvider
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth musi byc uzywany wewnatrz AuthProvider");
  }

  return context;
}
