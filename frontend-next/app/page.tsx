"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { getMyReservations } from "@/features/reservations/reservations.api";
import type { Reservation } from "@/features/reservations/reservations.types";
import { getRooms } from "@/features/rooms/rooms.api";
import type { Room } from "@/features/rooms/rooms.types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const { getIdToken } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const token = await getIdToken();
        const [roomsData, reservationsData] = await Promise.all([
          getRooms(),
          getMyReservations({}, token),
        ]);

        if (active) {
          setRooms(roomsData);
          setReservations(reservationsData);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Błąd pobierania danych do dashboard",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [getIdToken]);

  const activeRoomsCount = rooms.filter((room) => room.isActive).length;
  const nextReservations = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.status === "ACTIVE")
        .slice()
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        )
        .slice(0, 3),
    [reservations],
  );

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-8 md:px-8"
      data-measurement-page="dashboard"
      data-measurement-state={loading ? "loading" : error ? "error" : "ready"}
    >
      <div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">
          Aktywne sale: {activeRoomsCount}
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Najbliższe rezerwacje
            </h2>

            <Link
              href="/reservations"
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Zobacz wszystkie
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-600">
                Ładowanie rezerwacji...
              </div>
            ) : nextReservations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-600">
                Brak aktywnych rezerwacji
              </div>
            ) : (
              nextReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {reservation.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {reservation.room?.name ?? `Sala: ${reservation.roomId}`}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Aktywna
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    {formatDateTime(reservation.startTime)} —{" "}
                    {formatDateTime(reservation.endTime)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
