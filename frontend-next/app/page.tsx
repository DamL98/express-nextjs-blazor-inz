import Link from "next/link";
import { getRooms } from "@/features/rooms/rooms.api";
import { getMyReservations } from "@/features/reservations/reservations.api";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const [rooms, reservations] = await Promise.all([
    getRooms(),
    getMyReservations(),
  ]);

  const activeRoomsCount = rooms.filter((room) => room.isActive).length;
  const activeReservations = reservations.filter(
    (reservation) => reservation.status === "ACTIVE"
  );

  const nextReservations = activeReservations
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>

        <p className="mt-3 max-w-2xl text-gray-600">
          Wersja demo
        </p>
      </div>

      <section className="mt-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Najbliższe rezerwacje
              </h2>
            </div>

            <Link
              href="/reservations"
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              Zobacz wszystkie
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {nextReservations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-600">
                Brak aktywnych rezerwacji
              </div>
            ) : (
              nextReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {reservation.title}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {reservation.room?.name ??
                          `Sala: ${reservation.roomId}`}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Aktywna
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    {formatDateTime(reservation.startTime)} —{" "}
                    {formatDateTime(reservation.endTime)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}