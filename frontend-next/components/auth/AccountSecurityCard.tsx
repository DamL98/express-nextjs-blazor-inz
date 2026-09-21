"use client";

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
              { currentPassword: data.get("currentPassword"),
                password: data.get("password")
              })
          }
        );
        form.reset(); setMessage("Haslo zmienione. Pozostale sesje zostaly uniewaznione.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Operacja nie powiodla sie");
    }
    finally {
      setBusy(false);
    }
  }

  return <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold">Konto i logowanie</h2>
    <p className="my-3 text-sm">{user.googleId ? "Google jest polaczone. Mozesz logowac sie haslem lub przez Google." : "Polacz Google, aby dodac drugi sposob logowania. Dostep do kalendarza wlaczysz osobno ponizej."}</p>
    {query.get("googleLink") && <p role="status" className="mb-3">{query.get("googleLink") === "success" ? "Konto Google polaczone." : "Nie udalo sie polaczyc Google. Konto moze juz nalezec do innego uzytkownika; sprobuj ponownie."}</p>}
    <form onSubmit={submit} className="max-w-md space-y-3">
      <label className="block text-sm">Aktualne haslo<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} className="mt-1 w-full rounded border p-2" /></label>
      {!user.googleId && <button type="submit" value="link" disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white">Polacz konto Google</button>}
      <label className="block text-sm">Nowe haslo (co najmniej 15 znakow)<input name="password" type="password" autoComplete="new-password" minLength={15} maxLength={128} className="mt-1 w-full rounded border p-2" /></label>
      <button type="submit" value="password" disabled={busy} className="rounded border px-4 py-2">Zmien haslo</button>
    </form>
    {message && <p role="status" className="mt-3 text-green-700">{message}</p>}
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
  </section>;
}
