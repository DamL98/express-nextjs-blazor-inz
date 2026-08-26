"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GoogleCalendarIntegrationCard } from "@/components/google-calendar/GoogleCalendarIntegrationCard";
import { ReservationsList } from "@/components/reservations/ReservationList";
import { apiRequest, type Reservation } from "@/lib/api";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Reservation[]>("/reservations/my", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) { setReservations(data); }
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) { return; }

        setError(
          loadError instanceof Error ? loadError.message : "Błąd pobierania rezerwacji",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) { setLoading(false); }
      });

    return () => controller.abort();
  }, []);

  return (
    <main
      className="mx-auto max-w-5xl px-6 py-8"
      data-measurement-page="reservations"
      data-measurement-state={loading ? "loading" : error ? "error" : "ready"}
      data-measurement-count={reservations.length}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Moje rezerwacje
          </h1>
          <p className="mt-2 text-gray-600">Lista Twoich rezerwacji.</p>
        </div>

        <Link
          href="/rooms"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Zarezerwuj salę
        </Link>
      </div>

      <div className="mt-6">
        <GoogleCalendarIntegrationCard />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
            Ładowanie rezerwacji...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <ReservationsList initialReservations={reservations} />
        )}
      </div>
    </main>
  );
}
