"use client";

import { useState } from "react";
import Link from "next/link";

import { apiRequest, type Reservation } from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";

type ReservationsListProps = {
  initialReservations: Reservation[];
};

function getStatusLabel(status: Reservation["status"]) {
  if (status === "ACTIVE") {
    return "Aktywna";
  }

  if (status === "CANCELLED") {
    return "Anulowana";
  }

  return status;
}

function getStatusClassName(status: Reservation["status"]) {
  if (status === "ACTIVE") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "CANCELLED") {
    return "border-gray-200 bg-gray-50 text-gray-600";
  }

  return "border-gray-200 bg-gray-50 text-gray-600";
}

export function ReservationsList({ initialReservations }: ReservationsListProps) {
  const [reservations, setReservations] = useState(initialReservations);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCancel(id: string) {
    const confirmed = window.confirm( "Czy na pewno chcesz anulować tę rezerwację?");
    if (!confirmed) {
      return;
    }

    setPendingId(id);
    setErrorMessage(null);

    try {
      const cancelledReservation = await apiRequest<Reservation>(
        `/reservations/${encodeURIComponent(id)}/cancel`,
        { method: "PATCH" },
      );

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id ? cancelledReservation : reservation
        )
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : "Błąd anulowania rezerwacji";
      setErrorMessage(message);

    } finally {
      setPendingId(null);
    }
  }

  if (reservations.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
              <Link
                href="/rooms"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                ← back /dashboard
              </Link>
        Nie masz jeszcze żadnych rezerwacji
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {reservations.map((reservation) => (
        <article
          key={reservation.id}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {reservation.title}
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                {reservation.room?.name ?? `Sala: ${reservation.roomId}`}
              </p>
            </div>

            <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${getStatusClassName(reservation.status)}`}>
              {getStatusLabel(reservation.status)}
            </span>
          </div>

          {reservation.description && (
            <p className="mt-4 text-sm text-gray-700">
              {reservation.description}
            </p>
          )}

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Początek</dt>
              <dd className="font-medium text-gray-900">
                {formatDateTime(reservation.startTime)}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">Koniec</dt>
              <dd className="font-medium text-gray-900">
                {formatDateTime(reservation.endTime)}
              </dd>
            </div>
          </dl>

          {reservation.status === "ACTIVE" && (
            <button
              type="button"
              disabled={pendingId === reservation.id}
              onClick={() => handleCancel(reservation.id)}
              className="mt-5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingId === reservation.id
                ? "Anulowanie.."
                : "Anuluj rezerwacje"}
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
