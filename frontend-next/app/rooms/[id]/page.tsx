import Link from "next/link";

import { ReservationForm } from "@/components/reservations/ReservationForm";

import { getRoomById } from "@/features/rooms/rooms.api";


type RoomDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoomDetailsPage({
  params,
}: RoomDetailsPageProps) {
  const { id } = await params;
  const room = await getRoomById(id);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/rooms"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        ← Wróć do listy sal
      </Link>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          {room.name}
        </h1>

        <p className="mt-2 text-gray-600">
          {room.location}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Ilość miejsc</p>
            <p className="font-medium text-gray-900">
              {room.capacity}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium text-gray-900">
              {room.isActive ? "Aktywna" : "Nieaktywna"}
            </p>
          </div>
        </div>

        {room.description && (
          <p className="mt-6 text-gray-700">
            {room.description}
          </p>
        )}
      </section>

      {room.isActive ? (
        <ReservationForm roomId={room.id} />
      ) : (
        <section className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
          Ta sala jest nieaktywna i nie można jej zarezerwować.
        </section>
      )}



    </main>
  );
}