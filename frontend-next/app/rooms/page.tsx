import Link from "next/link";
import { getRooms } from "@/lib/api";

export default async function RoomsPage() {
  const rooms = await getRooms();

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Lista sal
      </h1>

      <p className="mt-2 text-gray-600">
        Wybierz sale
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <article
            key={room.id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {room.name}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              {room.location}
            </p>

            <p className="mt-3 text-sm text-gray-700">
              Ilość miejsc: {room.capacity}
            </p>

            <p className="mt-3 text-sm text-gray-500">
              {room.isActive ? "Aktywna" : "Nieaktywna"}
            </p>

            <Link
              href={`/rooms/${room.id}`}
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zobacz szczegóły
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}