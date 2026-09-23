"use client";


import { AppIcon } from "@/components/ui/AppIcon";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  apiRequest,
  type GoogleCalendarConnectionStatus,
} from "@/lib/api";
import { API_URL } from "@/lib/config/env";
import { formatDateTime } from "@/lib/formatters";
import { useAuth } from "@/components/auth-provider";

export function GoogleCalendarIntegrationCard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<GoogleCalendarConnectionStatus>("/google-calendar/status", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setStatus(data);
        }
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Błąd pobrania statusu Kalendarza Google",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const callbackStatus = searchParams.get("googleCalendar");
  const callbackReason = searchParams.get("reason");
  const reasonMessages: Record<string, string> = {
    access_denied:
      "Łączenie kalendarza zostało anulowane. Możesz spróbować ponownie.",
    google_account_mismatch:
      "Wybierz konto Google połączone z Twoim kontem aplikacji.",
    google_refresh_token_missing:
      "Nie udało się uzyskać dostępu do kalendarza. Połącz ponownie.",
    missing_code: "Nie udało się dokończyć połączenia. Spróbuj ponownie.",
  };
  const callbackMessage =
    callbackStatus === "connected"
      ? {
        tone: "success",
        text: "Kalendarz Google został połączony.",
      } as const
      : callbackStatus === "error"
        ? {
          tone: "error",
          text:
            reasonMessages[callbackReason ?? ""] ??
            "Nie udało się połączyć Kalendarza Google.",
        } as const
        : null;

  function handleConnect() {
    const url = new URL(`${API_URL}/google-calendar/connect/start`);
    url.searchParams.set("redirectTo", window.location.href);
    window.location.assign(url.toString());
  }

  const connectedAt = formatDateTime(status?.connectedAt ?? null);

  return (
    <section data-measurement-calendar={loading ? "loading" : error ? "error" : "ready"} className="overflow-hidden rounded-2xl border border-app-line bg-white shadow-sm">
      <div className="border-b border-app-line bg-slate-50/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Integracje</p>
        <h2 className="mt-2 text-xl font-bold"><AppIcon name="calendar-days" />Kalendarz Google</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-app-muted">Terminy spotkań również w twoim kalendarzu.</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-app-muted">Połączenie kalendarza jest za osobną zgodą.</p>
      </div>
      <div className="p-6">
        {callbackMessage && <div role="status" className={`mb-5 rounded-xl border p-4 text-sm ${callbackMessage.tone === "success" ? "border-teal-200 bg-teal-50 text-teal-800" : "border-red-200 bg-red-50 text-red-800"}`}>{callbackMessage.text}</div>}
        {loading ? (
          <p role="status" className="rounded-xl bg-slate-50 p-5 text-sm text-app-muted">Sprawdzanie połączenia z kalendarzem…</p>
        ) : error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-semibold">Nie można sprawdzić połączenia</p>
            <p className="mt-2">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 font-medium"><AppIcon name="refresh-cw" />Spróbuj ponownie</button>
          </div>
        ) : status?.connected ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-5">
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900"><AppIcon name="circle-check" />Kalendarz połączony</span>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-app-muted">Konto kalendarza</dt>
                <dd className="mt-1 break-words font-semibold">{status.calendarEmail || "Brak adresu w danych połączenia"}</dd>
              </div>
              <div>
                <dt className="text-app-muted">Data połączenia</dt>
                <dd className="mt-1 font-semibold">{connectedAt || "Brak danych"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-6 text-teal-900">{status.syncEnabled ? "Integracja nowych rezerwacji jest włączona." : "Połączenie jest zapisane, ale synchronizacja nie jest włączona."} Status połączenia nie potwierdza dodania każdego wydarzenia.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-app-line bg-slate-50 p-5">
            <p className="font-semibold">
              {user?.googleId ? "Włącz kalendarz dla swoich spotkań" : "Zacznij od połączenia konta Google"}
            </p>
            <p className="mt-2 text-sm leading-6 text-app-muted">
              {user?.googleId ? "Konto Google jest już połączone z aplikacją. Udziel osobnej zgody, aby dodawać nowe rezerwacje do kalendarza." : "W sekcji konta i logowania podaj aktualne hasło i połącz Google. Następnie możesz włączyć integrację kalendarza."}
            </p>
            {user?.googleId && <button type="button" onClick={handleConnect} className="mt-4 rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"><AppIcon name="link" />Włącz integrację kalendarza</button>}
          </div>
        )}
        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div><h3 className="font-semibold">Nowe spotkania</h3><p className="mt-2 leading-6 text-app-muted">Po włączeniu integracji aplikacja próbuje dodawać nowe rezerwacje do Kalendarza Google.</p></div>
          <div><h3 className="font-semibold">Dotychczasowe rezerwacje</h3><p className="mt-2 leading-6 text-app-muted">Wcześniejsze spotkania nie są automatycznie eksportowane. Rezerwacje nadal znajdziesz w aplikacji.</p></div>
        </div>
      </div>
    </section>
  );
}
