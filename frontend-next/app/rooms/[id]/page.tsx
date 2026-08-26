"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ReservationForm } from "@/components/reservations/ReservationForm";
import { apiRequest, type Room } from "@/lib/api";

export default function RoomDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Room>(`/rooms/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setRoom(data);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Blad pobierania danych sali",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [id]);

  const measurementState = isLoading
    ? "loading"
    : errorMessage || !room
      ? "error"
      : "ready";

  return (
    <main
      className="mx-auto max-w-4xl px-6 py-8"
      data-measurement-page="room-details"
      data-measurement-state={measurementState}
    >
      <Link
        href="/rooms"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Wroc do listy sal
      </Link>

      {isLoading ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          Ladowanie...
        </div>
      ) : errorMessage || !room ? (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage ?? "Nie znaleziono sali"}
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>

            <p className="mt-2 text-gray-600">{room.location}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Liczba miejsc</p>
                <p className="font-medium text-gray-900">{room.capacity}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium text-gray-900">
                  {room.isActive ? "Aktywna" : "Nieaktywna"}
                </p>
              </div>
            </div>

            {room.description ? (
              <p className="mt-6 text-gray-700">{room.description}</p>
            ) : null}
          </section>

          {room.isActive ? (
            <ReservationForm roomId={room.id} />
          ) : (
            <section className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
              Ta sala jest nieaktywna i nie mozna jej zarezerwowac.
            </section>
          )}
        </>
      )}
    </main>
  );
}
