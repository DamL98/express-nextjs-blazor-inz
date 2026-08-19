"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth-provider";

function authErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Nieznany blad";
}

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function googleLogin() {
    setError("");
    setSubmitting(true);

    try {
      await loginWithGoogle();
    } catch (loginError) {
      setError(authErrorMessage(loginError));
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-[430px] rounded-[22px] border border-blue-900/20 bg-white/[.97] p-[38px] shadow-[0_24px_70px_rgba(23,32,51,0.14)] max-[480px]:px-[22px] max-[480px]:py-7">
        <p className="mb-2 text-xs font-extrabold tracking-[0.14em] text-[var(--app-accent)] uppercase">System rezerwacji</p>
        <h1 className="text-[32px] font-bold tracking-[-0.04em] text-[var(--app-ink)]">Zaloguj sie</h1>
        <p className="mt-[10px] mb-[26px] leading-[1.55] text-[var(--app-muted)]">Zaloguj sie przez konto Google</p>

        <button
          className="flex min-h-[46px] w-full items-center justify-center gap-[10px] rounded-[11px] border border-[var(--app-line)] bg-white font-[750] text-[var(--app-ink)] hover:border-[#aebbd0] hover:bg-[#f6f8fc] disabled:cursor-wait disabled:opacity-65"
          type="button"
          onClick={() => void googleLogin()}
          disabled={submitting}
        >
          <span className="text-lg font-extrabold text-[#4285f4]">G</span>
          {submitting ? "Przekierowanie..." : "Kontynuuj z Google"}
        </button>

        {error ? (
          <p className="mt-4 rounded-[9px] bg-[#fff0f0] px-3 py-[11px] text-[13px] leading-[1.4] text-[#9d2424]" role="alert">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
