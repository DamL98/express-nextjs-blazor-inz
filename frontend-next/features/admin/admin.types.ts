import type {
  Reservation,
  ReservationStatus,
} from "@/features/reservations/reservations.types";

export type AdminReservation = Reservation;

export type AdminReservationFilters = {
  status?: ReservationStatus | "";
  roomId?: string;
};