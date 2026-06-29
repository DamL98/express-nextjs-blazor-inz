import Link from "next/link";

import { getMyReservations } from "@/features/reservations/reservations.api";
import { ReservationsList } from "@/components/reservations/ReservationList";

export default async function ReservationsPage() {
  const reservations = await getMyReservations();

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Moje rezerwacje
          </h1>

          <p className="mt-2 text-gray-600">
            Lista
          </p>
        </div>

        <Link
          href="/rooms"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Zarezerwuj salę
        </Link>
      </div>

      <div className="mt-6">
        <ReservationsList initialReservations={reservations} />
      </div>
    </main>
  );
}