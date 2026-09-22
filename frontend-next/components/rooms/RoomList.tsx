"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Room } from "@/lib/api";
import { filterRooms } from "@/lib/view-filters";
import { EmptyState } from "@/components/ui/EmptyState";

type RoomListProps = {
  rooms: Room[];
};

export function RoomList({ rooms }: RoomListProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const capacity = searchParams.get("capacity") || "";
  const activeParam = searchParams.get("active") || "all";
  const sortParam = searchParams.get("sort") || "name";
  const active = ["true", "false"].includes(activeParam) ? activeParam : "all";
  const sort = ["capacity-asc", "capacity-desc"].includes(sortParam) ? sortParam : "name";
  const hasFilters = Boolean(search || capacity || active !== "all" || sort !== "name");

  // Filtry dotyczą już pobranych sal i nie zmieniają zapytania do backendu.
  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    window.history.replaceState(null, "", params.size ? `/rooms?${params.toString()}` : "/rooms");
  }

  const filteredRooms = filterRooms(rooms, { search, capacity, active, sort });

  return (
    <>
      <section aria-label="Wyszukiwanie sal" className="mb-6 rounded-2xl border border-app-line bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-app-ink">
            Nazwa lub lokalizacja
            <input type="search" value={search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Np. sala A, budynek B…" className="mt-2 min-h-11 w-full rounded-xl border border-app-line px-3 py-2 font-normal" />
          </label>

          <label className="text-sm font-medium text-app-ink">
            Minimalna liczba miejsc
            <input type="number" min={1} step={1} value={capacity} onChange={(event) => updateFilter("capacity", event.target.value)} placeholder="Dowolna" className="mt-2 min-h-11 w-full rounded-xl border border-app-line px-3 py-2 font-normal" />
          </label>

          <label className="text-sm font-medium text-app-ink">
            Możliwość rezerwacji
            <select value={active} onChange={(event) => updateFilter("active", event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-app-line bg-white px-3 py-2 font-normal">
              <option value="all">Wszystkie sale</option>
              <option value="true">Aktywne</option>
              <option value="false">Wyłączone z rezerwacji</option>
            </select>
          </label>

          <label className="text-sm font-medium text-app-ink">
            Sortowanie
            <select value={sort} onChange={(event) => updateFilter("sort", event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-app-line bg-white px-3 py-2 font-normal">
              <option value="name">Nazwa: A–Z</option>
              <option value="capacity-asc">Liczba miejsc: rosnąco</option>
              <option value="capacity-desc">Liczba miejsc: malejąco</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p role="status" className="text-sm text-app-muted">Wyniki: <strong className="text-app-ink">{filteredRooms.length}</strong> z {rooms.length} sal</p>
          {hasFilters && <button type="button" onClick={() => window.history.replaceState(null, "", "/rooms")} className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Wyczyść filtry</button>}
        </div>

      </section>

      {filteredRooms.length === 0 ? (
        <EmptyState title="Nie znaleziono sal" description="Zmień nazwę, lokalizację lub wymaganą liczbę miejsc. Możesz też wyczyścić filtry i przejrzeć wszystkie sale." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <article key={room.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-app-line bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md">

              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl border border-blue-100 bg-white text-xl text-blue-800">▦</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-app-ink">{room.capacity} miejsc</span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="break-words text-lg font-bold text-app-ink">{room.name}</h2>

                <p className="mt-1 break-words text-sm text-app-muted">{room.location}</p>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-app-muted">{room.description || "Sprawdź szczegóły sali i wybierz termin swojego spotkania."}</p>
                <p className={`mt-5 text-xs font-medium ${room.isActive ? "text-teal-700" : "text-app-muted"}`}>
                  {room.isActive ? "Aktywna · termin sprawdzisz przy rezerwacji" : "Wyłączona z rezerwacji"}
                </p>

                <Link prefetch={false} href={`/rooms/${room.id}${searchParams.size ? `?${searchParams.toString()}` : ""}`} className={`mt-5 block rounded-xl px-4 py-3 text-center text-sm font-semibold ${room.isActive ? "bg-blue-900 text-white hover:bg-blue-800" : "border border-app-line text-app-muted hover:bg-slate-50"}`}>
                  {room.isActive ? "Wybierz termin" : "Zobacz szczegóły"}<span className="sr-only">: {room.name}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
