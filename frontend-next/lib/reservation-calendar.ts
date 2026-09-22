import type { Reservation } from "./api/api-contracts.types";

export function getDayReservations(reservations: Reservation[], day: Date): Reservation[] {
  const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

  return reservations.filter((reservation) => {
    const start = new Date(reservation.startTime).getTime();
    const end = new Date(reservation.endTime).getTime();

    return reservation.status === "ACTIVE" &&
      Number.isFinite(start) && Number.isFinite(end) && start < end &&
      start < endOfDay.getTime() && end > startOfDay.getTime();
  }).sort((first, second) => {
    return new Date(first.startTime).getTime() - new Date(second.startTime).getTime();
  });
}
