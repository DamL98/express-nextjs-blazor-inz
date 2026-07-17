"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { GoogleCalendarIntegrationCard } from "@/components/google-calendar/GoogleCalendarIntegrationCard";
import { ReservationsList } from "@/components/reservations/ReservationList";
import { getMyReservations } from "@/features/reservations/reservations.api";
import type { Reservation } from "@/features/reservations/reservations.types";

export default function ReservationsPage() {
  const { getIdToken } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReservations() {
      try {
        const token = await getIdToken();
        const data = await getMyReservations({}, token);
        if (active) {
          setReservations(data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Błąd pobierania rezerwacji",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReservations();

    return () => {
      active = false;
    };
  }, [getIdToken]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
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
