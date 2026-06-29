"use client";

import {
  GoogleAuthProvider,
  User as FirebaseUser,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest } from "@/lib/api/http-client";
import { firebaseAuth } from "@/lib/firebase";

// wzorzec usera zapisany w lokalnej bazie
// backend zwraca ten obiekt po zweryfikowaniu tokenu firebase
export type LocalUser = {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  role: { name: string };
};

// wlasciwosci i funkcje do ktorych maja dostep componenty wewnatrz AuthContext
type AuthContext = {
  // uwierzytelniony user przez Firebase Auth z uuid fb
  firebaseUser: FirebaseUser | null;
  // powiązany rekord z firebaseUser w local db, ma local user id i user role
  user: LocalUser | null;
  loading: boolean;

  // login form od firebase
  login: (email: string, password: string) => Promise<void>;
  // register form od firebase, user uwierzytelniony tworzy sie w firebase a "profil" w local db
  register: (fullName: string, email: string, password: string) => Promise<void>;

  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // zwraca token używany w headerze Authorization potrzebne do api
  getIdToken: () => Promise<string>;
};

// null context na start przed zalogowaniem
const AuthContext = createContext<AuthContext | null>(null);



async function synchronizeUser(firebaseUser: FirebaseUser) {
  // odnowiony token po rejestracji
  const token = await firebaseUser.getIdToken(true);

  return apiRequest<LocalUser>("/auth/session", {
    method: "POST",
    token,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // firebase zapisuje sesje w przeglądarce - nie ma auto logout usera po refresh strony
    void setPersistence(firebaseAuth, browserLocalPersistence);

    return onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setFirebaseUser(currentUser);

      // brak currentUser = brak aktywnej sesji firebase
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // pobranie rekordu z localdb dla aktywnej sesji przegladarki
        setUser(await synchronizeUser(currentUser));
      } catch (error) {
        console.error("Błąd synchronizacji użytkownika: ", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  // USER LOGIN
  const login = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);

    // po zalogowaniu jest synchro danych pomiedzy firebase a local db dla zalogowanego usera
    setUser(await synchronizeUser(credential.user));
  }, []);

  // USER REGISTER
  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      // firebase user create
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

      await updateProfile(credential.user, { displayName: fullName.trim() });

      // update local usera z tym w firebase
      setUser(await synchronizeUser(credential.user));
    },
    [],
  );


  // GOOGLE LOGIN
  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();

    // wybor konta google do logowania zamiast automat
    provider.setCustomParameters({ prompt: "select_account" });

    const credential = await signInWithPopup(firebaseAuth, provider);
    setUser(await synchronizeUser(credential.user));
  }, []);

  // LOGOUT
  // logout konczy sesje z firebase i czysci lokalne dane ze stanu
  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    setUser(null);
  }, []);


  const getIdToken = useCallback(async () => {
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      throw new Error("Użytkownik nie jest zalogowany");
    }

    return currentUser.getIdToken();
  }, []);

  // ograniczenia re-renderowania komponentow korzystajacych z useAuth dopoki zadna wartosc sie nie zmieni
  const value = useMemo(
    () => ({ firebaseUser, user, loading, login, register, loginWithGoogle, logout, getIdToken }),
    [firebaseUser, user, loading, login, register, loginWithGoogle, logout, getIdToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook udostępniający dane i metody uwierzytelniania komponentom wewn. AuthProvider
export function useAuth() {
  const context = useContext(AuthContext);

  // uzycie hooka poza <AuthProvider>
  if (!context) {
    throw new Error("useAuth musi być używany wewnątrz AuthProvider");
  }

  return context;
}
