"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, type Dashboard } from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";

import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingCards } from "@/components/ui/LoadingCards";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReservationCalendar } from "@/components/reservations/ReservationCalendar";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<Dashboard>("/dashboard", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setDashboard(data);
        }
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Błąd pobierania danych do dashboard",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const activeRoomsCount = dashboard?.activeRoomsCount ?? 0;
  const nextReservations = dashboard?.nextReservations ?? [];

  const nextReservation = nextReservations[0];

  return (
    <main
      className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10"
      data-measurement-page="dashboard"
      data-measurement-state={loading ? "loading" : error ? "error" : "ready"}
    >
      <PageHeader title="Twój plan spotkań" description="Najbliższe rezerwacje i dostęp do sal — wszystko, czego potrzebujesz na początek dnia.">
        <Link prefetch={false} href="/rooms" className="inline-block rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">Zarezerwuj salę</Link>
      </PageHeader>

      {loading ? <LoadingCards /> : error ? <ErrorNotice message={error} /> : (
        <>
          <section aria-label="Podsumowanie" className="grid gap-5 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl bg-blue-950 p-6 text-white sm:p-8 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Najbliższe spotkanie</p>
              <h2 className="mt-5 break-words text-2xl font-bold">{nextReservation?.title || "Przestrzeń na nowe plany"}</h2>
              {nextReservation ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-blue-100">{formatDateTime(nextReservation.startTime)} — {formatDateTime(nextReservation.endTime)}</p>
                  <p className="mt-2 break-words text-sm text-blue-200">{nextReservation.room?.name ?? "Sala spotkania"}{nextReservation.room?.location ? ` · ${nextReservation.room.location}` : ""}</p>
                  <Link prefetch={false} href={`/rooms/${nextReservation.roomId}`} className="mt-6 inline-block rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-950 hover:bg-blue-50">Szczegóły sali <span aria-hidden="true" >→</span></Link>
                </>
              ) : (
                <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">Nie masz nadchodzących rezerwacji. Wybierz salę i zaplanuj kolejne spotkanie.</p>
              )}
            </div>
            <div className="flex flex-col rounded-2xl border border-app-line bg-white p-6 sm:p-8">
              <p className="text-sm font-medium text-app-muted">Aktywne sale</p>
              <p className="mt-4 text-5xl font-bold tracking-tight text-app-ink">{activeRoomsCount}</p>
              <p className="mt-3 text-sm leading-6 text-app-muted">Sale dostępne do rezerwacji. Wolny termin zależy od harmonogramu sali.</p>
              <Link prefetch={false} href="/rooms" className="mt-auto pt-5 text-sm font-semibold text-blue-700">Przeglądaj sale <span aria-hidden="true" >→</span></Link>
            </div>
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-app-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-line p-6">
              <div>
                <h2 className="text-lg font-bold">Najbliższe rezerwacje</h2>
                <p className="mt-1 text-sm text-app-muted">Szybki podgląd Twoich kolejnych spotkań.</p>
              </div>
              <Link prefetch={false} href="/reservations" className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Zobacz wszystkie</Link>
            </div>
            {nextReservations.length === 0 ? (
              <div className="p-5"><EmptyState title="Twój kalendarz jest jeszcze pusty" description="Pierwsza rezerwacja pojawi się tutaj po zapisaniu spotkania.">
                <Link prefetch={false} href="/rooms" className="text-sm font-semibold text-blue-700">Znajdź salę</Link>
              </EmptyState></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {nextReservations.map((reservation) => (
                  <article key={reservation.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                    <div className="w-fit shrink-0 rounded-xl bg-blue-50 px-4 py-3 text-center text-blue-900">
                      <p className="text-xl font-bold">{new Date(reservation.startTime).toLocaleDateString("pl-PL", { day: "2-digit" })}</p>
                      <p className="text-xs font-medium">{new Date(reservation.startTime).toLocaleDateString("pl-PL", { month: "short" })}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold">{reservation.title}</h3>
                      <p className="mt-1 break-words text-sm text-app-muted">{reservation.room?.name ?? `Sala: ${reservation.roomId}`}</p>
                      <p className="mt-2 text-sm text-app-muted">{formatDateTime(reservation.startTime)} — {formatDateTime(reservation.endTime)}</p>
                    </div>
                    <Link prefetch={false} href={`/rooms/${reservation.roomId}`} className="shrink-0 rounded-xl border border-app-line px-4 py-3 text-center text-sm font-medium hover:bg-slate-50">Zobacz salę</Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      <ReservationCalendar />
    </main>
  );
}
