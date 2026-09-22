import type { Reservation, Room } from "./api/api-contracts.types";

type RoomFilters = {
  search: string;
  capacity: string;
  active: string;
  sort: string;
};

export function filterRooms(rooms: Room[], filters: RoomFilters): Room[] {
  const minimum = Number(filters.capacity);

  return rooms.filter((room) => {
    const matchesSearch = `${room.name} ${room.location}`.toLocaleLowerCase("pl").includes(filters.search.trim().toLocaleLowerCase("pl"));
    const matchesCapacity = !Number.isFinite(minimum) || minimum <= 0 || room.capacity >= minimum;
    const matchesActive = !["true", "false"].includes(filters.active) || room.isActive === (filters.active === "true");

    return matchesSearch && matchesCapacity && matchesActive;
  }).sort((first, second) => {
    if (filters.sort === "capacity-asc") return first.capacity - second.capacity;
    if (filters.sort === "capacity-desc") return second.capacity - first.capacity;
    return first.name.localeCompare(second.name, "pl");
  });
}

// status czasowy jest tylko informacyjnym widokiem, anulowanie ma pierwszeństwo
export function getReservationGroup(reservation: Reservation, currentTime: number): string {
  if (reservation.status === "CANCELLED") return "cancelled";
  return new Date(reservation.endTime).getTime() <= currentTime ? "history" : "upcoming";
}
