"use client";


import { AppIcon } from "@/components/ui/AppIcon";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ReservationForm } from "@/components/reservations/ReservationForm";
import { apiRequest, type Room } from "@/lib/api";

import { LoadingCards } from "@/components/ui/LoadingCards";
import { ErrorNotice } from "@/components/ui/ErrorNotice";

export default function RoomDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return <Suspense fallback={<LoadingCards count={2} />}><RoomDetails key={id} id={id} /></Suspense>;
}

function RoomDetails({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const roomsUrl = searchParams.size ? `/rooms?${searchParams.toString()}` : "/rooms";
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
      className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10"
      data-measurement-page="room-details"
      data-measurement-state={measurementState}
    >
      <Link prefetch={false} href={roomsUrl} className="mb-6 inline-block rounded-lg py-2 text-sm font-semibold text-blue-700 hover:underline"><AppIcon name="arrow-left" />Wróć do listy sal</Link>

      {isLoading ? <LoadingCards count={2} /> : errorMessage || !room ? (
        <ErrorNotice message={errorMessage ?? "Nie znaleziono sali"} />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="overflow-hidden rounded-2xl border border-app-line bg-white shadow-sm">

            <div className="flex items-end justify-between gap-4 bg-blue-950 p-7 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Przestrzeń do spotkań</p>
                <h1 className="mt-4 break-words text-3xl font-bold tracking-tight">{room.name}</h1>
                <p className="mt-3 break-words text-sm text-blue-100">{room.location}</p>
              </div>
              <span aria-hidden="true" className="text-4xl text-blue-300"><AppIcon name="building-2" className="size-10" /></span>
            </div>

            <div className="p-7">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs text-app-muted">Liczba miejsc</dt>
                  <dd className="mt-2 text-2xl font-bold">{room.capacity}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <dt className="text-xs text-app-muted">Status sali</dt>
                  <dd className={`mt-2 text-sm font-semibold ${room.isActive ? "text-teal-700" : "text-app-muted"}`}>{room.isActive ? "Aktywna" : "Wyłączona z rezerwacji"}</dd>
                </div>
              </dl>

              <h2 className="mt-7 text-base font-bold">O sali</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-app-muted">{room.description || "Brak dodatkowego opisu. Lokalizację i liczbę miejsc znajdziesz powyżej."}</p>

              <div className="mt-7 border-t border-app-line pt-5 text-sm leading-6 text-app-muted">
                <p className="font-semibold text-app-ink">Jak zarezerwować?</p>
                <ol className="mt-3 list-inside list-decimal space-y-2"><li>Wybierz datę i godziny spotkania</li><li>Wpisz nazwę i sprawdź podsumowanie</li><li>Zapisz rezerwację — sprawdzimy termin</li></ol>
              </div>
            </div>

          </section>

          {room.isActive ? <ReservationForm roomId={room.id} roomName={room.name} /> : (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-900">
              <h2 className="font-bold">Ta sala jest wyłączona z rezerwacji</h2>
              <p className="mt-2">Wybierz inne miejsce, aby zaplanować spotkanie</p>

              <Link prefetch={false} href="/rooms" className="mt-4 inline-block font-semibold underline">Przeglądaj pozostałe sale</Link>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
