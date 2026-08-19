import type { Reservation } from "@/features/reservations/reservations.types";

export type Dashboard = {
  activeRoomsCount: number;
  nextReservations: Reservation[];
};
