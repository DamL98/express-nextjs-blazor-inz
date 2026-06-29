"use client";

import { FirebaseError } from "firebase/app";
import { type SubmitEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";

function authErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "Nieznany błąd";
  }

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Konto z tym e-mail już istnieje",
    "auth/invalid-credential": "Nieprawidłowy e-mail lub hasło",
    "auth/invalid-email": "Niepoprawny adres e-mail",
    "auth/popup-closed-by-user": "Google popup login zamkniete",
    "auth/popup-blocked": "Google popup window zablokowany",
    "auth/weak-password": "Hasło musi mieć co najmniej 6 znaków",
  };

  return messages[error.code] || "Błąd logowania";
}

export default function Home() {
  const { user, loading, login, register, loginWithGoogle, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Hasła nie są takie same");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(fullName, email, password);
      } else {
        await login(email, password);
      }
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function googleLogin() {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="auth-shell"><div className="auth-card">Ładowanie sesji...</div></main>;
  }

  if (user) {
    return (
      <main className="auth-shell">
        <section className="auth-card profile-card">
          {user.avatarUrl ? (
            <img className="avatar" src={user.avatarUrl} alt="Avatar użytkownika" />
          ) : null}

          <p className="eyebrow">Zalogowano</p>
          <h1>{user.fullName}</h1>
          <p className="muted">{user.email}</p>

          <dl className="profile-details">
            <div>
              <dt>Rola</dt>
              <dd>{user.role.name}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user.emailVerified ? "zweryfikowany" : "niezweryfikowany"}</dd>
            </div>
            <div>
              <dt>Dane</dt>
              <dd>Firebase + PostgreSQL</dd>
            </div>
          </dl>
          <button className="secondary-button" onClick={() => void logout()}>Wyloguj</button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">System rezerwacji</p>
        <h1>{mode === "login" ? "Zaloguj się" : "Utwórz konto"}</h1>

        <p className="muted">
          {mode === "login" ? "Uzyskaj dostęp do swoich rezerwacji" : "Rejestracja zapisze profil w lokalnej bazie PostgreSQL"}
        </p>

        <button className="google-button" type="button" onClick={() => void googleLogin()} disabled={submitting}>
          <span className="google-mark">G</span> Kontynuuj z Google
        </button>

        <div className="separator"><span>lub</span></div>

        <form onSubmit={submit}>
          {mode === "register" ? (
            <label>Imię i nazwisko<input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" /></label>
          ) : null}

          <label>
            E-mail <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>

          <label>
            Hasło <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>

          {mode === "register" ? (
            <label>
              Powtórz hasło <input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
            </label>
          ) : null}

          {error ? <p className="error-message" role="alert">{error}</p> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "Czekaj.." : mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
          </button>
        </form>

        <button className="mode-button" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "Nie masz konta? Zarejestruj się" : "Masz już konto? Zaloguj się"}
        </button>
      </section>
    </main>
  );
}