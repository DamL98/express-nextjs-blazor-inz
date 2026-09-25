"use client";


import { AppIcon } from "@/components/ui/AppIcon";
import { useEffect, useState } from "react";
import Link from "next/link";

import { apiRequest, type Reservation } from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";
import { getReservationGroup } from "@/lib/view-filters";

import { EmptyState } from "@/components/ui/EmptyState";
import { CancelReservationDialog } from "./CancelReservationDialog";

type ReservationsListProps = {
  initialReservations: Reservation[];
};

export function ReservationsList({ initialReservations }: ReservationsListProps) {
  const [reservations, setReservations] = useState(initialReservations);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  function getGroup(reservation: Reservation) {
    return getReservationGroup(reservation, currentTime);
  }

  const tabs = [
    { value: "upcoming", label: "Nadchodzące" },
    { value: "history", label: "Historia" },
    { value: "cancelled", label: "Anulowane" },
    { value: "all", label: "Wszystkie" },
  ];
  const filteredReservations = reservations.filter((reservation) => {
    const matchesTab = activeTab === "all" || getGroup(reservation) === activeTab;
    const matchesSearch = `${reservation.title} ${reservation.room?.name ?? ""}`.toLocaleLowerCase("pl").includes(search.trim().toLocaleLowerCase("pl"));
    return matchesTab && matchesSearch;
  }).sort((first, second) => {
    const difference = new Date(first.startTime).getTime() - new Date(second.startTime).getTime();
    return activeTab === "upcoming" ? difference : -difference;
  });

  async function handleCancel(id: string) {
    setMessage(null);
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
      setMessage("Rezerwacja anulowana. Znajdziesz ją w zakładce Anulowane.");
      setSelectedReservation(null);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Błąd anulowania rezerwacji";
      setErrorMessage(message);

    } finally {
      setPendingId(null);
    }
  }

  if (reservations.length === 0) {
    return (
      <EmptyState title="Nie masz jeszcze rezerwacji" description="Znajdź salę dopasowaną do spotkania i wybierz pierwszy termin.">
        <Link prefetch={false} href="/rooms" className="inline-block rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"><AppIcon name="calendar-plus" />Zarezerwuj salę</Link>
      </EmptyState>
    );
  }

  return (
    <section className="space-y-5" aria-label="Lista rezerwacji">
      <div className="rounded-2xl border border-app-line bg-white p-4 sm:p-5">
        <div role="group" aria-label="Okres rezerwacji" className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.value} type="button" aria-pressed={activeTab === tab.value} onClick={() => setActiveTab(tab.value)} className={`rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === tab.value ? "bg-blue-900 text-white" : "bg-slate-50 text-app-muted hover:bg-slate-100"}`}>
              {tab.label} <span className="ml-1 opacity-75">{reservations.filter((reservation) => tab.value === "all" || getGroup(reservation) === tab.value).length}</span>
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm font-medium">
          Znajdź rezerwację
          <input id="reservation-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tytuł spotkania lub nazwa sali…" className="mt-2 min-h-11 w-full rounded-xl border border-app-line px-4 py-2 font-normal" />
        </label>

        <p role="status" className="mt-3 text-xs text-app-muted">Widoczne rezerwacje: {filteredReservations.length}</p>
      </div>

      {errorMessage && !selectedReservation && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div>}

      {message && <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">{message}</div>}

      {filteredReservations.length === 0 ? (
        <EmptyState title="Brak rezerwacji w tym widoku" description="Wybierz inny okres lub usuń wpisaną frazę, aby zobaczyć pozostałe spotkania.">
          <button type="button" onClick={() => { setSearch(""); setActiveTab("all"); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Pokaż wszystkie</button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation) => {
            const group = getGroup(reservation);
            const inProgress = group === "upcoming" && new Date(reservation.startTime).getTime() <= currentTime;
            const statusLabel = group === "cancelled" ? "Anulowana" : group === "history" ? "Zakończona" : inProgress ? "W trakcie" : "Nadchodząca";

            return (
              <article data-measurement-reservation-id={reservation.id} key={reservation.id} className="rounded-2xl border border-app-line bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="break-words text-base font-bold">{reservation.title}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${group === "upcoming" ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <Link
                      prefetch={false}
                      href={`/rooms/${reservation.roomId}`}
                      className="mt-2 inline-block break-words text-sm font-medium text-blue-700 hover:underline">
                        {reservation.room?.name ?? `Sala: ${reservation.roomId}`}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-app-muted">{formatDateTime(reservation.startTime)} — {formatDateTime(reservation.endTime)}</p>
                  </div>

                  {reservation.status === "ACTIVE" && (
                    <button type="button" disabled={pendingId !== null} onClick={() => { setErrorMessage(null); setSelectedReservation(reservation); }} className="shrink-0 rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">
                      <AppIcon name="calendar-x" />{pendingId === reservation.id ? "Anulowanie…" : "Anuluj rezerwację"}
                    </button>
                  )}

                </div>
                {reservation.description && (
                  <details className="mt-4 border-t border-slate-100 pt-4">
                    <summary className="w-fit cursor-pointer rounded text-sm font-medium text-app-muted">Opis spotkania</summary>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-app-muted">{reservation.description}</p>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}
      {selectedReservation && <CancelReservationDialog reservation={selectedReservation} busy={pendingId !== null} error={errorMessage} onClose={() => setSelectedReservation(null)} onConfirm={() => void handleCancel(selectedReservation.id)} />}
    </section>
  );
}
