import type { Room } from "@/features/rooms/rooms.types";

export type ReservationStatus = "ACTIVE" | "CANCELLED";

export type Reservation = {
  id: string;
  userId: string;
  roomId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  googleCalendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
  room?: Room;
};

export type CreateReservationPayload = {
  roomId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
};

export type ReservationFilters = {
  status?: ReservationStatus | "";
  roomId?: string;
};