"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  cancelAdminReservation,
  getAdminReservations,
} from "@/features/admin/admin.api";
import type { AdminReservation } from "@/features/admin/admin.types";
import { getRooms } from "@/features/rooms/rooms.api";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Nie udało się pobrać danych panelu administratora.";
}

function getStatusStyles(status: AdminReservation["status"]) {
  switch (status) {
    case "ACTIVE":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getStatusLabel(status: AdminReservation["status"]) {
  switch (status) {
    case "ACTIVE":
      return "Aktywna";
    case "CANCELLED":
      return "Anulowana";
    default:
      return status;
  }
}

export function AdminReservationsPanel() {
  const { user, getIdToken } = useAuth();
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelledReservationId, setCancelledReservationId] = useState<
    string | null
  >(null);

  const isAdmin = user?.role.name === "admin";

  const fetchAdminData = useCallback(async () => {
    const token = await getIdToken();
    const [reservationData, rooms] = await Promise.all([
      getAdminReservations(token),
      getRooms(),
    ]);

    return {
      reservations: reservationData,
      roomNames: Object.fromEntries(
        rooms.map((room) => [room.id, room.name]),
      ),
    };
  }, [getIdToken]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isCurrent = true;

    void fetchAdminData()
      .then((data) => {
        if (isCurrent) {
          setReservations(data.reservations);
          setRoomNames(data.roomNames);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(getErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [fetchAdminData, isAdmin]);

  async function handleReload() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAdminData();
      setReservations(data.reservations);
      setRoomNames(data.roomNames);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel(reservationId: string) {
    if (!window.confirm("Czy na pewno chcesz anulować tę rezerwację?")) {
      return;
    }

    setCancelledReservationId(reservationId);
    setError(null);

    try {
      const token = await getIdToken();
      const updatedReservation = await cancelAdminReservation(
        reservationId,
        token,
      );

      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === updatedReservation.id
            ? updatedReservation
            : reservation,
        ),
      );
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setCancelledReservationId(null);
    }
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-bold text-slate-950">Brak dostępu</h1>
          <p className="mt-2 text-slate-700">
            Panel jest dostępny wyłącznie dla użytkowników z rolą administratora.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          Administracja
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Rezerwacje użytkowników
        </h1>
        <p className="mt-3 text-slate-600">
          Lista wszystkich rezerwacji utworzonych w systemie.
        </p>
      </div>

      {error ? (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void handleReload()}
            className="mt-3 font-semibold text-red-800 underline underline-offset-2"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-600">Ładowanie rezerwacji...</p>
        ) : error && reservations.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">
            Nie można obecnie wyświetlić listy rezerwacji.
          </p>
        ) : reservations.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">
            W systemie nie ma jeszcze rezerwacji.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tytuł</th>
                  <th className="px-4 py-3 font-semibold">Sala</th>
                  <th className="px-4 py-3 font-semibold">Rozpoczęcie</th>
                  <th className="px-4 py-3 font-semibold">Zakończenie</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((reservation) => {
                  const isCancelling =
                    cancelledReservationId === reservation.id;

                  return (
                    <tr key={reservation.id} className="text-slate-700">
                      <td className="px-4 py-4 font-medium text-slate-950">
                        {reservation.title}
                      </td>
                      <td className="px-4 py-4">
                        {reservation.room?.name ??
                          roomNames[reservation.roomId] ??
                          reservation.roomId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDateTime(reservation.startTime)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDateTime(reservation.endTime)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyles(
                            reservation.status,
                          )}`}
                        >
                          {getStatusLabel(reservation.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {reservation.status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => void handleCancel(reservation.id)}
                            disabled={isCancelling}
                            className="bg-transparent p-0 text-sm font-medium text-red-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isCancelling ? "Anulowanie..." : "Anuluj"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Brak akcji</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
