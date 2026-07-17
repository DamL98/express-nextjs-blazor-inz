"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent, useState } from "react";

import { useAuth } from "@/components/auth-provider";

function authErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Nieznany blad";
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
      setError("Hasla nie sa takie same");
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

    try {
      await loginWithGoogle();
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    }
  }

  return (
    <main className="auth-shell login-page">
      <section className="auth-card">
        <p className="eyebrow">System rezerwacji</p>
        <h1>{mode === "login" ? "Zaloguj sie" : "Utworz konto"}</h1>

        <p className="muted">
          {mode === "login"
            ? "Zaloguj sie przez konto Google"
            : "Blad"}
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
              Imie i nazwisko
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
            Haslo
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
              Powtorz haslo
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
              ? "Czekaj.."
              : mode === "login"
                ? "Zaloguj sie"
                : "Zarejestruj sie"}
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
            ? "Nie masz konta? Zarejestruj sie"
            : "Masz juz konto? Zaloguj sie"}
        </button>
      </section>
    </main>
  );
}
