"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-8">
      <section className="rounded-login border border-blue-900/20 bg-white/97 p-login shadow-login max-login:px-login-mobile max-login:py-7">
        <p className="mb-2 text-xs font-extrabold tracking-eyebrow text-app-accent uppercase">System rezerwacji</p>
        <h1 className="text-login-title font-bold tracking-login-title text-app-ink">Zaloguj sie</h1>
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

        <form aria-label="Logowanie lokalne">
          <fieldset className="space-y-4">
            <label className="block text-sm font-semibold text-app-ink">
              E-mail
              <input
                className="mt-2 min-h-control w-full rounded-control border border-app-line bg-white px-3 text-base font-normal text-app-ink outline-none focus:border-app-accent"
                type="email"
                autoComplete="email"
                placeholder="uzytkownik@example.com"
              />
            </label>

            <label className="block text-sm font-semibold text-app-ink">
              Haslo
              <input
                className="mt-2 min-h-control w-full rounded-control border border-app-line bg-white px-3 text-base font-normal text-app-ink outline-none focus:border-app-accent"
                type="password"
                autoComplete="current-password"
                placeholder="Wprowadz haslo"
              />
            </label>

            <button
              className="min-h-control w-full rounded-control bg-app-accent font-bold text-white"
              type="button"
            >
              Zaloguj sie
            </button>
          </fieldset>
        </form>

        {error ? (
          <p className="mt-4 rounded-notice bg-app-error-surface px-3 py-notice text-notice leading-notice text-app-error-text" role="alert">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
