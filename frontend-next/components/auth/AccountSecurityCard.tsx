"use client";


import { AppIcon } from "@/components/ui/AppIcon";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { apiRequest } from "@/lib/api";

export function AccountSecurityCard() {
  const { user } = useAuth();
  const query = useSearchParams();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user?.hasLocalPassword) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");

    try {
      if (action === "link") {
        const result = await apiRequest<{ authorizationUrl: string }>("/auth/google/link",
          {
            method: "POST",
            body: JSON.stringify({
              password: data.get("currentPassword"),
              redirectTo: window.location.href
            }),
          });
        window.location.assign(result.authorizationUrl);
      } else {
        await apiRequest(
          "/auth/password/change",
          {
            method: "POST",
            body: JSON.stringify(
              {
                currentPassword: data.get("currentPassword"),
                password: data.get("password")
              })
          }
        );
        form.reset(); setMessage("Hasło zmienione");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Operacja nie powiodła się");
    }
    finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-app-line bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Bezpieczeństwo</p>
      <h2 className="mt-2 text-xl font-bold"><AppIcon name="shield-check" />Konto i logowanie</h2>

      <p className="mt-3 max-w-xl text-sm leading-6 text-app-muted">{user.googleId ? "Google jest połączone. Możesz logować się hasłem lub przez Google." : "Połącz Google, aby dodać drugi sposób logowania. Dostęp do kalendarza włączysz osobno."}</p>

      {query.get("googleLink") && <p role="status" className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">{query.get("googleLink") === "success" ? "Konto Google połączone." : "Nie udało się połączyć Google. Konto może już należeć do innego użytkownika; spróbuj ponownie."}</p>}


      <form onSubmit={submit} className="mt-6 max-w-xl space-y-5">
        <label className="block text-sm font-medium"><AppIcon name="lock-keyhole" />Aktualne hasło
          <input name="currentPassword" type="password" autoComplete="current-password" required minLength={12} maxLength={128} className="mt-2 min-h-11 w-full rounded-xl border border-app-line px-3 py-2" />
        </label>

        {!user.googleId && <button type="submit" value="link" disabled={busy} className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"><AppIcon name="link" />Połącz konto Google</button>}

        <div className="border-t border-app-line pt-5">
          <label className="block text-sm font-medium"><AppIcon name="lock-keyhole" />Nowe hasło
            <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} aria-describedby="password-hint" className="mt-2 min-h-11 w-full rounded-xl border border-app-line px-3 py-2" />
          </label>
          <p id="password-hint" className="mt-2 text-xs text-app-muted">Min. 12 znaków</p>
        </div>

        <button type="submit" value="password" disabled={busy} className="rounded-xl border border-app-line px-4 py-3 text-sm font-semibold hover:bg-slate-50">
          {busy ? "Proszę czekać…" : "Zmień hasło"}
        </button>
      </form>

      {message && <p role="status" className="mt-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    </section>
  );
}
