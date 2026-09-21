"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { loginWithGoogle, loginLocal } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const query = useSearchParams();
  const callbackError = query.get("auth") === "error"
    ? query.get("reason") === "account_link_conflict"
      ? "Zaloguj sie dotychczasowa metoda i polacz Google na stronie rezerwacji."
      : "Logowanie Google nie powiodlo sie. Sprobuj ponownie."
    : "";


  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage(""); setSubmitting(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password") || "");
    try {
      if (mode === "login") await loginLocal(email, password);
      else {
        const endpoint = mode === "register" ? "/register" : mode === "forgot" ? "/password/forgot" : "/verification/request";
        const result = await apiRequest<{ message: string }>(`/auth${endpoint}`, {
          method: "POST", body: JSON.stringify({ email, password, fullName: data.get("fullName"), redirectTo: `${window.location.origin}/auth/action` }),
        });
        setMessage(result.message);
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Nie udalo sie wykonac operacji"); }
    finally { setSubmitting(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-8">
      <section className="rounded-login border border-blue-900/20 bg-white/97 p-login shadow-login max-login:px-login-mobile max-login:py-7">
        <p className="mb-2 text-xs font-extrabold tracking-eyebrow text-app-accent uppercase">System rezerwacji</p>
        <h1 className="text-login-title font-bold tracking-login-title text-app-ink">{mode === "register" ? "Utworz konto" : mode === "forgot" ? "Reset hasla" : mode === "verify" ? "Potwierdz e-mail" : "Zaloguj sie"}</h1>
        <p className="mt-2.5 mb-6.5 leading-login text-app-muted">Zaloguj sie przez konto Google lub lokalnie</p>

        <button
          className="flex min-h-control w-full items-center justify-center gap-2.5 rounded-control border border-app-line bg-white font-control text-app-ink hover:border-app-line-hover hover:bg-app-surface-hover disabled:cursor-wait disabled:opacity-65"
          type="button"
          onClick={async () => {
            setError("");
            setSubmitting(true);

            try {
              await loginWithGoogle();
            } catch (loginError) {
              setError(
                loginError instanceof Error
                  ? loginError.message
                  : "Nieznany blad",
              );
              setSubmitting(false);
            }
          }}
          disabled={submitting}
        >
          <span className="text-lg font-extrabold text-google">G</span>
          {submitting ? "Przekierowanie..." : "Kontynuuj z Google"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold text-app-muted uppercase">
          <span className="h-px flex-1 bg-app-line" />
          <span>lub</span>
          <span className="h-px flex-1 bg-app-line" />
        </div>

        <form aria-label="Logowanie lokalne" onSubmit={submit}>
          <fieldset className="space-y-4" disabled={submitting}>
            {mode === "register" && <label className="block text-sm font-semibold text-app-ink">Imie i nazwisko
              <input name="fullName" required maxLength={100} autoComplete="name" className="mt-2 min-h-control w-full rounded-control border border-app-line px-3" />
            </label>}
            <label className="block text-sm font-semibold text-app-ink">
              E-mail
              <input
                className="mt-2 min-h-control w-full rounded-control border border-app-line bg-white px-3 text-base font-normal text-app-ink outline-none focus:border-app-accent"
                type="email"
                name="email" required maxLength={254}
                autoComplete="email"
                placeholder="uzytkownik@example.com"
              />
            </label>

            {(mode === "login" || mode === "register") && <label className="block text-sm font-semibold text-app-ink">
              Haslo
              <input
                className="mt-2 min-h-control w-full rounded-control border border-app-line bg-white px-3 text-base font-normal text-app-ink outline-none focus:border-app-accent"
                type="password"
                name="password" required minLength={mode === "register" ? 15 : 1} maxLength={128}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                placeholder={mode === "register" ? "Co najmniej 15 znakow" : "Wprowadz haslo"}
              />
            </label>}

            <button
              className="min-h-control w-full rounded-control bg-app-accent font-bold text-white"
              type="submit"
            >
              {submitting ? "Prosze czekac..." : mode === "login" ? "Zaloguj sie" : mode === "register" ? "Zarejestruj sie" : "Wyslij link"}
            </button>
          </fieldset>
        </form>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-app-accent">
          {[["login", "Logowanie"], ["register", "Rejestracja"], ["forgot", "Nie pamietam hasla"], ["verify", "Wyslij ponownie potwierdzenie"]].filter(([key]) => key !== mode).map(([key, label]) => (
            <button key={key} type="button" disabled={submitting} onClick={() => { setMode(key); setError(""); setMessage(""); }}>{label}</button>
          ))}
        </div>
        {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}
        {error || callbackError ? (
          <p className="mt-4 rounded-notice bg-app-error-surface px-3 py-notice text-notice leading-notice text-app-error-text" role="alert">{error || callbackError}</p>
        ) : null}
      </section>
    </main>
  );
}
