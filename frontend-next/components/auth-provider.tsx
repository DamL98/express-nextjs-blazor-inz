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

// wzorzec usera zapisany w lokalnej bazie
// backend zwraca ten obiekt po potwierdzeniu aktywnej sesji
export type LocalUser = {
  id: string;
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  role: { name: string };
};

// wlasciwosci i funkcje do ktorych maja dostep componenty wewnatrz AuthContext
type AuthContext = {
  user: LocalUser | null;
  loading: boolean;
  // lokalny formularz logowania zostaje w UI, ale aktualna architektura
  // obsluguje tylko Google OAuth po stronie backendu
  login: (_email: string, _password: string) => Promise<void>;
  register: (_fullName: string, _email: string, _password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // zwraca token uzywany w headerze Authorization potrzebne do api
  // przy sesji cookie backendu nie jest juz potrzebny, ale interfejs zostaje
  getIdToken: () => Promise<string>;
};

// null context na start przed zalogowaniem
const AuthContext = createContext<AuthContext | null>(null);

const GOOGLE_LOGIN_UNAVAILABLE_MESSAGE =
  "Customowe logowanie jest off, zaloguj przez google";

async function getCurrentSessionUser() {
  return apiRequest<LocalUser>("/auth/me", {
    cache: "no-store",
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        // pobranie rekordu z localdb dla aktywnej sesji przegladarki
        const currentUser = await getCurrentSessionUser();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  // USER LOGIN
  const login = useCallback(async () => {
    throw new Error(GOOGLE_LOGIN_UNAVAILABLE_MESSAGE);
  }, []);

  // USER REGISTER
  const register = useCallback(async () => {
    throw new Error(GOOGLE_LOGIN_UNAVAILABLE_MESSAGE);
  }, []);

  // GOOGLE LOGIN
  const loginWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/login`;
    const url = new URL(`${API_URL}/auth/google/start`);

    url.searchParams.set("redirectTo", redirectTo);
    window.location.assign(url.toString());
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
    setUser(null);
  }, []);

  const getIdToken = useCallback(async () => "", []);

  // ograniczenia re-renderowania komponentow korzystajacych z useAuth
  // dopoki zadna wartosc sie nie zmieni
  const value = useMemo(
    () => ({ user, loading, login, register, loginWithGoogle, logout, getIdToken }),
    [user, loading, login, register, loginWithGoogle, logout, getIdToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook udostepniajacy dane i metody uwierzytelniania komponentom wewn. AuthProvider
export function useAuth() {
  const context = useContext(AuthContext);

  // uzycie hooka poza <AuthProvider>
  if (!context) {
    throw new Error("useAuth musi byc uzywany wewnatrz AuthProvider");
  }

  return context;
}
