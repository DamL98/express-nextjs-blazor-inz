"use client";


import { AppIcon } from "@/components/ui/AppIcon";
import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { DayButton, DayPicker, type DayButtonProps } from "@daypicker/react";
import { pl } from "@daypicker/react/locale";

import { apiRequest, type Reservation, type Room } from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";
import { getDayReservations } from "@/lib/reservation-calendar";
import { LoadingCards } from "@/components/ui/LoadingCards";

const CalendarReservationsContext = createContext<Reservation[]>([]);

function ReservationDayButton(props: DayButtonProps) {
  const reservations = useContext(CalendarReservationsContext);
  const count = getDayReservations(reservations, props.day.date).length;

  return (
    <DayButton
      {...props}
      aria-label={`${props["aria-label"]}. Liczba aktywnych rezerwacji: ${count}`}
    >
      {props.children}
      {count > 0 && (
        <span aria-hidden="true" className="reservation-calendar-count">
          {count}
        </span>
      )}
    </DayButton>
  );
}

export function ReservationCalendar() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomsUnavailable, setRoomsUnavailable] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    // Pełna lista jest potrzebna także dla miesięcy poza trzema najbliższymi spotkaniami.
    Promise.allSettled([
      apiRequest<Reservation[]>("/reservations/my", { signal: controller.signal }),
      apiRequest<Room[]>("/rooms", { signal: controller.signal }),
    ])
      .then(([reservationResult, roomResult]) => {
        if (controller.signal.aborted) return;

        if (reservationResult.status === "rejected") {
          throw reservationResult.reason;
        }

        setReservations(reservationResult.value);
        setRooms(roomResult.status === "fulfilled" ? roomResult.value : []);
        setRoomsUnavailable(roomResult.status === "rejected");
        setUpdatedAt(new Date());
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Nie udało się pobrać kalendarza rezerwacji.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [requestVersion]);

  function refreshCalendar() {
    setLoading(true);
    setError(null);
    setRequestVersion((current) => current + 1);
  }

  function showToday() {
    const today = new Date();
    setSelectedDay(today);
    setMonth(today);
  }

  const dayReservations = getDayReservations(reservations, selectedDay);
  const dateLabel = selectedDay.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section
      aria-labelledby="reservation-calendar-title"
      aria-busy={loading}
      data-measurement-reservation-calendar={loading ? "loading" : error ? "error" : "ready"}
      className="mt-8 overflow-hidden rounded-2xl border border-app-line bg-white"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-app-line p-5 sm:p-6">

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Twój miesiąc</p>
          <h2 id="reservation-calendar-title" className="mt-2 text-xl font-bold"><AppIcon name="calendar-days" />Kalendarz rezerwacji</h2>
          <p className="mt-2 text-sm leading-6 text-app-muted">Wybierz dzień, aby zobaczyć godziny spotkań i zarezerwowane sale</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={showToday}
            className="rounded-xl border border-app-line px-4 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            <AppIcon name="calendar-days" />Dzisiaj
          </button>

          <button
            type="button"
            onClick={refreshCalendar}
            disabled={loading}
            className="rounded-xl border border-app-line px-4 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            <AppIcon name="refresh-cw" />{loading ? "Odświeżanie…" : "Odśwież rezerwacje"}
          </button>

        </div>
      </div>

      {loading ? (
        <div className="p-6"><LoadingCards count={2} /></div>
      ) : error ? (
        <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">

          <p className="font-semibold">Nie udało się wczytać kalendarza</p>
          <p className="mt-2 break-words">{error}</p>

          <button type="button" onClick={refreshCalendar} className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold">
            <AppIcon name="refresh-cw" />Spróbuj ponownie
          </button>
        </div>
      ) : (
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 border-b border-app-line p-3 sm:p-6 lg:border-r lg:border-b-0">

            <CalendarReservationsContext.Provider value={reservations}>
              <DayPicker
                mode="single"
                required
                locale={pl}
                weekStartsOn={1}
                selected={selectedDay}
                onSelect={setSelectedDay}
                month={month}
                onMonthChange={setMonth}
                showOutsideDays
                fixedWeeks
                navLayout="after"
                className="reservation-calendar"
                modifiers={{ reserved: (day) => getDayReservations(reservations, day).length > 0 }}
                modifiersClassNames={{ reserved: "reservation-calendar-reserved" }}
                components={{ DayButton: ReservationDayButton }}
              />
            </CalendarReservationsContext.Provider>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 px-2 text-xs text-app-muted">
              <span className="flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal-700" />Liczba w dniu: aktywne rezerwacje</span>
              <span className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded border-2 border-blue-900" />Wybrany dzień</span>
            </div>

          </div>

          <div className="min-w-0 bg-slate-50/50 p-5 sm:p-6">

            <div role="status" aria-live="polite">
              <h3 className="text-base font-bold capitalize">{dateLabel}</h3>
              <p className="mt-2 text-sm text-app-muted">Aktywne rezerwacje: {dayReservations.length}</p>
            </div>

            {roomsUnavailable && <p className="mt-3 text-xs text-amber-800">Nazwy sal chwilowo niedostępne. Terminy zostają widoczne.</p>}

            {dayReservations.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-app-line bg-white p-5">
                <p className="font-semibold">Brak spotkań w tym dniu</p>
                <p className="mt-2 text-sm leading-6 text-app-muted">Nie masz aktywnych rezerwacji na wybrany dzień. Anulowane spotkania nie są zaznaczane.</p>
                <Link prefetch={false} href="/rooms" className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">Znajdź salę</Link>
              </div>
            ) : (
              <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
                {dayReservations.map((reservation) => {
                  const room = reservation.room || rooms.find((item) => item.id === reservation.roomId);

                  return (
                    <article key={reservation.id} className="rounded-xl border border-app-line bg-white p-4">
                      <h4 className="break-words font-semibold">{reservation.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-app-muted">{formatDateTime(reservation.startTime)} — {formatDateTime(reservation.endTime)}</p>

                      <Link
                        prefetch={false}
                        href={`/rooms/${reservation.roomId}`}
                        className="mt-3 inline-block break-words text-sm font-semibold text-blue-700 hover:underline"
                      >
                        {room?.name || `Sala: ${reservation.roomId}`}
                      </Link>

                      {room?.location && <p className="mt-1 break-words text-xs text-app-muted">{room.location}</p>}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      <div className="border-t border-app-line px-5 py-4 text-xs leading-5 text-app-muted sm:px-6">
        <p>Kalendarz pokazuje rezerwacje aplikacji. Przy włączonej integracji nowe rezerwacje są wysyłane do Google. Zmiany wykonane w Google nie są pobierane.</p>
        <div className="mt-2 flex flex-wrap justify-between gap-2">
          <Link prefetch={false} href="/settings" className="font-semibold text-blue-700 hover:underline">Ustawienia Google Calendar</Link>
          {updatedAt && !loading && !error && <span>Odczyt z aplikacji: {updatedAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
      </div>
    </section>
  );
}
