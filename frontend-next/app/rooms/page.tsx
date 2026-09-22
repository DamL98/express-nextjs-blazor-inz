"use client";

import { Suspense, useEffect, useState } from "react";

import { apiRequest, type Room } from "@/lib/api";

import { RoomList } from "@/components/rooms/RoomList";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingCards } from "@/components/ui/LoadingCards";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { EmptyState } from "@/components/ui/EmptyState";

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
      className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10"
      data-measurement-page="rooms"
      data-measurement-state={measurementState}
      data-measurement-count={rooms.length}
    >
      <PageHeader title="Znajdź salę" description="Wybierz przestrzeń dopasowaną do spotkania. Termin sprawdzisz podczas rezerwacji." />
      {isLoading ? (
        <LoadingCards count={6} />
      ) : errorMessage ? (
        <ErrorNotice message={errorMessage} />
      ) : rooms.length === 0 ? (
        <EmptyState title="Brak sal do wyświetlenia" description="Obecnie nie ma dostępnych sal" />
      ) : (
        <Suspense fallback={<LoadingCards count={6} />}>
          <RoomList rooms={rooms} />
        </Suspense>
      )}
    </main>
  );
}
