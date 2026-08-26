"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-[430px] rounded-[22px] border border-blue-900/20 bg-white/[.97] p-[38px] shadow-[0_24px_70px_rgba(23,32,51,0.14)] max-[480px]:px-[22px] max-[480px]:py-7">
        <p className="mb-2 text-xs font-extrabold tracking-[0.14em] text-[var(--app-accent)] uppercase">System rezerwacji</p>
        <h1 className="text-[32px] font-bold tracking-[-0.04em] text-[var(--app-ink)]">Zaloguj sie</h1>
        <p className="mt-[10px] mb-[26px] leading-[1.55] text-[var(--app-muted)]">Zaloguj sie przez konto Google lub lokalnie</p>

        <button
          className="flex min-h-[46px] w-full items-center justify-center gap-[10px] rounded-[11px] border border-[var(--app-line)] bg-white font-[750] text-[var(--app-ink)] hover:border-[#aebbd0] hover:bg-[#f6f8fc] disabled:cursor-wait disabled:opacity-65"
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
          <span className="text-lg font-extrabold text-[#4285f4]">G</span>
          {submitting ? "Przekierowanie..." : "Kontynuuj z Google"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold text-[var(--app-muted)] uppercase">
          <span className="h-px flex-1 bg-[var(--app-line)]" />
          <span>lub</span>
          <span className="h-px flex-1 bg-[var(--app-line)]" />
        </div>

        <form aria-label="Logowanie lokalne">
          <fieldset className="space-y-4">
            <label className="block text-sm font-semibold text-[var(--app-ink)]">
              E-mail
              <input
                className="mt-2 min-h-[46px] w-full rounded-[11px] border border-[var(--app-line)] bg-white px-3 text-base font-normal text-[var(--app-ink)] outline-none focus:border-[var(--app-accent)]"
                type="email"
                autoComplete="email"
                placeholder="uzytkownik@example.com"
              />
            </label>

            <label className="block text-sm font-semibold text-[var(--app-ink)]">
              Haslo
              <input
                className="mt-2 min-h-[46px] w-full rounded-[11px] border border-[var(--app-line)] bg-white px-3 text-base font-normal text-[var(--app-ink)] outline-none focus:border-[var(--app-accent)]"
                type="password"
                autoComplete="current-password"
                placeholder="Wprowadz haslo"
              />
            </label>

            <button
              className="min-h-[46px] w-full rounded-[11px] bg-[var(--app-accent)] font-bold text-white"
              type="button"
            >
              Zaloguj sie
            </button>
          </fieldset>
        </form>

        {error ? (
          <p className="mt-4 rounded-[9px] bg-[#fff0f0] px-3 py-[11px] text-[13px] leading-[1.4] text-[#9d2424]" role="alert">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
