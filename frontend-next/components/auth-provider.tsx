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

import { apiRequest } from "@/lib/api";
import { API_URL } from "@/lib/config/env";

// Profil konta Google zapisany w bazie aplikacji.
// Backend zwraca go po zweryfikowaniu sesji użytkownika.
export type LocalUser = {
  id: string;
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  role: { name: string };
};

// Stan uwierzytelnienia udostępniany komponentom potomnym providera.
type AuthContext = {
  user: LocalUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

// Wartość null pozwala wykryć użycie useAuth poza AuthProvider.
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

  useEffect(() => {
    const controller = new AbortController();

    // Backend odtwarza użytkownika na podstawie ciasteczka sesyjnego.
    getCurrentSessionUser(controller.signal)
      .then((currentUser) => {
        if (!controller.signal.aborted) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  // Logowanie odbywa się wyłącznie przez Google OAuth obsługiwane przez backend.
  const loginWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/login`;
    const url = new URL(`${API_URL}/auth/google/start`);

    url.searchParams.set("redirectTo", redirectTo);
    window.location.assign(url.toString());
  }, []);

  // Backend usuwa ciasteczko sesyjne, a frontend czyści bieżący profil.
  const logout = useCallback(async () => {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
    setUser(null);
  }, []);

  // Zachowuje referencję kontekstu, dopóki nie zmieni się jego stan.
  const value = useMemo(
    () => ({ user, loading, loginWithGoogle, logout }),
    [user, loading, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Udostępnia stan uwierzytelnienia wyłącznie wewnątrz AuthProvider.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth musi byc uzywany wewnatrz AuthProvider");
  }

  return context;
}
