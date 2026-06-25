import type {
  ApiResponse,
  Room,
  Reservation,
  CreateReservationPayload,
  ReservationFilters,
} from "./types";


const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("brak NEXT_PUBLIC_API_UR w env");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || body.success === false) {
    const message =
      body.success === false ? body.error.message : "błąd API serwera";

    throw new Error(message);
  }

  return body.data;
}

export type GetRoomsFilters = {
  active?: "true" | "false" | "";
  capacityMin?: string;
};

export function getRooms(filters: GetRoomsFilters = {}): Promise<Room[]> {
  const params = new URLSearchParams();

  if (filters.active !== undefined && filters.active !== "") {
    params.set("active", filters.active);
  }

  if (filters.capacityMin) {
    params.set("capacityMin", filters.capacityMin);
  }

  const query = params.toString();

  return request<Room[]>(`/rooms${query ? `?${query}` : ""}`);
}

export function getRoomById(id: string): Promise<Room> {
  return request<Room>(`/rooms/${id}`);
}

export function createReservation(
  payload: CreateReservationPayload
): Promise<Reservation> {
  return request<Reservation>("/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyReservations(
  filters: ReservationFilters = {}
): Promise<Reservation[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.roomId) {
    params.set("roomId", filters.roomId);
  }

  const query = params.toString();

  return request<Reservation[]>(`/reservations/my${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
}

export function cancelReservation(id: string): Promise<Reservation> {
  return request<Reservation>(`/reservations/${id}/cancel`, {
    method: "PATCH",
  });
}