"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

const subscribe = () => () => {};

export default function AuthActionPage() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated ? <AuthActionForm /> : <p className="p-8">Ladowanie...</p>;
}

function AuthActionForm() {
  const [data] = useState(() => new URLSearchParams(window.location.hash.slice(1)));
  const action = data.get("action") || "";
  const [token, setToken] = useState(data.get("token") || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const password = new FormData(event.currentTarget).get("password");

    try {
      const result = await apiRequest<{ message: string }>(action === "verify-email" ? "/auth/verify-email" : "/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });

      setMessage(result.message); setToken("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nieprawidlowy link");
    }
    finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto max-w-lg p-8">
    <h1 className="mb-6 text-2xl font-bold">{action === "verify-email" ? "Potwierdz adres e-mail" : "Ustaw nowe haslo"}</h1>
    {token && ["verify-email", "reset-password"].includes(action) ? <form onSubmit={submit} className="space-y-4">
      {action === "reset-password" && <label className="block">Nowe haslo (co najmniej 15 znakow)
        <input className="mt-2 w-full rounded border p-3" type="password" name="password" autoComplete="new-password" minLength={15} maxLength={128} required />
      </label>}
      <button className="rounded bg-blue-600 px-4 py-2 text-white" disabled={busy}>{busy ? "Prosze czekac..." : "Potwierdz"}</button>
    </form> : <p>{message || "Otworz pelny link z wiadomosci e-mail."}</p>
    }

    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}

    <Link href="/login" className="mt-6 block text-blue-700">Przejdz do logowania</Link>
  </main>;
}
