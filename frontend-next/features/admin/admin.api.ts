import { apiRequest } from "@/lib/api/http-client";
import type { AdminReservation, AdminReservationFilters } from "./admin.types";

export function getAdminReservations(
  filters: AdminReservationFilters = {}
): Promise<AdminReservation[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.roomId) {
    params.set("roomId", filters.roomId);
  }

  const query = params.toString();

  return apiRequest<AdminReservation[]>(
    `/admin/reservations${query ? `?${query}` : ""}`,
    {
      cache: "no-store",
    }
  );
}

export function cancelAdminReservation(id: string): Promise<AdminReservation> {
  return apiRequest<AdminReservation>(`/admin/reservations/${id}/cancel`, {
    method: "PATCH",
  });
}