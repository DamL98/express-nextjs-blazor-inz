import { apiRequest } from "@/lib/api/http-client";
import type {
  CreateReservationPayload,
  Reservation,
  ReservationFilters,
} from "./reservations.types";

export function createReservation(
  payload: CreateReservationPayload,
  token: string,
): Promise<Reservation> {
  return apiRequest<Reservation>("/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function getMyReservations(
  filters: ReservationFilters = {},
  token: string,
): Promise<Reservation[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.roomId) {
    params.set("roomId", filters.roomId);
  }

  const query = params.toString();

  return apiRequest<Reservation[]>(
    `/reservations/my${query ? `?${query}` : ""}`,
    {
      cache: "no-store",
      token,
    },
  );
}

export function cancelReservation(
  id: string,
  token: string,
): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${id}/cancel`, {
    method: "PATCH",
    token,
  });
}
