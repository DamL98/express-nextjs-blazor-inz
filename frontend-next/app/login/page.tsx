"use client";

import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";

function authErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "Nieznany błąd.";
  }

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Konto z tym e-mail już istnieje",
    "auth/invalid-credential": "Nieprawidłowy e-mail lub hasło",
    "auth/invalid-email": "Błędny adres adres e-mail",
    "auth/popup-closed-by-user": "Zamknięte Popup Google",
    "auth/popup-blocked": "Popup Google zablokowane przez przegladarke",
    "auth/weak-password": "Hasło musi mieć co najmniej 6 znaków",
  };

  return messages[error.code] || "Błąd logowania";
}

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();
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

      router.replace("/");
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
      router.replace("/");
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell login-page">
      <section className="auth-card">
        <p className="eyebrow">System rezerwacji</p>
        <h1>{mode === "login" ? "Zaloguj się" : "Utwórz konto"}</h1>

        <p className="muted">
          {mode === "login"
            ? "Uzyskaj dostęp do swoich rezerwacji."
            : "Utwórz konto użytkownika aplikacji."}
        </p>

        <button
          className="google-button"
          type="button"
          onClick={() => void googleLogin()}
          disabled={submitting}
        >
          <span className="google-mark">G</span> Kontynuuj z Google
        </button>

        <div className="separator"><span>lub</span></div>

        <form onSubmit={submit}>
          {mode === "register" ? (
            <label>
              Imię i nazwisko
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
              />
            </label>
          ) : null}

          <label>
            E-mail
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Hasło
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "register" ? (
            <label>
              Powtórz hasło
              <input
                required
                minLength={6}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>
          ) : null}

          {error ? <p className="error-message" role="alert">{error}</p> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting
              ? "Proszę czekać..."
              : mode === "login"
                ? "Zaloguj się"
                : "Zarejestruj się"}
          </button>
        </form>

        <button
          className="mode-button"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "Nie masz konta? Zarejestruj się"
            : "Masz już konto? Zaloguj się"}
        </button>
      </section>
    </main>
  );
}
