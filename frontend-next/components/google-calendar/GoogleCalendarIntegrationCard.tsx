"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  getGoogleCalendarStatus,
  redirectToGoogleCalendarConnection,
} from "@/features/google-calendar/google-calendar.api";
import type { GoogleCalendarConnectionStatus } from "@/features/google-calendar/google-calendar.types";

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusMessage(
  status: string | null,
  reason: string | null,
) {
  if (status === "connected") {
    return {
      tone: "success" as const,
      text: "Konto Google Calendar zostalo polaczone",
    };
  }

  if (status === "error") {
    const reasonMessages = {
      access_denied: "Polaczenie Google Calendar zostalo anulowane przez uzytkownika",
      google_account_mismatch:
        "Wybrane konto Google nie zgadza sie z kontem uzytym do logowania",
      google_refresh_token_missing:
        "Google nie zwrocil refresh tokena. Ponownie polacz konto",
      missing_code: "Google nie zwrocil kodu autoryzacyjnego",
    };

    return {
      tone: "error" as const,
      text:
        reasonMessages[reason as keyof typeof reasonMessages] ||
        "Blad laczenia z Google Calendar",
    };
  }

  return null;
}

export function GoogleCalendarIntegrationCard() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const data = await getGoogleCalendarStatus();

        if (active) {
          setStatus(data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Blad pobrania statusu Google Calendar",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  const callbackMessage = useMemo(
    () =>
      getStatusMessage(
        searchParams.get("googleCalendar"),
        searchParams.get("reason"),
      ),
    [searchParams],
  );

  function handleConnect() {
    redirectToGoogleCalendarConnection(window.location.href);
  }

  const connectedAt = formatDateTime(status?.connectedAt ?? null);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Integracja Google Calendar
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Zapis rezerwacji w kalendarzu google
          </p>
        </div>

        {!status?.connected ? (
          <button
            type="button"
            onClick={handleConnect}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Polacz z Google
          </button>
        ) : null}
      </div>

      {callbackMessage ? (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            callbackMessage.tone === "success"
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {callbackMessage.text}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {loading ? (
          <p className="text-sm text-gray-600">Ladowanie statusu...</p>
        ) : status?.connected ? (
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium text-gray-900">Status:</span>{" "}
              polaczono
            </p>
            <p>
              <span className="font-medium text-gray-900">Konto:</span>{" "}
              {status.calendarEmail || "brak danych"}
            </p>
            <p>
              <span className="font-medium text-gray-900">Polaczono:</span>{" "}
              {connectedAt || "brak danych"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Konto Google nie jest jeszcze polaczone z Google Calendar
          </p>
        )}
      </div>
    </section>
  );
}
