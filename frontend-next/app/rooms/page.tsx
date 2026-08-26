"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, type Room } from "@/lib/api";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Room[]>("/rooms", {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setRooms(data);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Blad pobierania listy sal",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const measurementState = isLoading
    ? "loading"
    : errorMessage
      ? "error"
      : "ready";

  return (
    <main
      className="mx-auto max-w-6xl px-6 py-8"
      data-measurement-page="rooms"
      data-measurement-state={measurementState}
      data-measurement-count={rooms.length}
    >
      <h1 className="text-2xl font-bold text-gray-900">Lista sal</h1>

      <p className="mt-2 text-gray-600">Wybierz sale</p>

      {isLoading ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          Ladowanie sal...
        </div>
      ) : errorMessage ? (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : rooms.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          Brak sal do wyswietlenia
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <article
              key={room.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {room.name}
              </h2>

              <p className="mt-1 text-sm text-gray-600">{room.location}</p>

              <p className="mt-3 text-sm text-gray-700">
                Liczba miejsc: {room.capacity}
              </p>

              <p className="mt-3 text-sm text-gray-500">
                {room.isActive ? "Aktywna" : "Nieaktywna"}
              </p>

              <Link
                href={`/rooms/${room.id}`}
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Zobacz szczegoly
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
