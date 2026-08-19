import { apiRequest } from "@/lib/api/http-client";
import type {
  GetRoomsFilters,
  Room,
  RoomAvailability,
} from "./rooms.types";

export function getRooms(
  filters: GetRoomsFilters = {},
  signal?: AbortSignal,
): Promise<Room[]> {
  const params = new URLSearchParams();

  if (filters.active !== undefined && filters.active !== "") {
    params.set("active", filters.active);
  }

  if (filters.capacityMin) {
    params.set("capacityMin", filters.capacityMin);
  }

  const query = params.toString();

  return apiRequest<Room[]>(`/rooms${query ? `?${query}` : ""}`, { signal });
}

export function getRoomById(id: string, signal?: AbortSignal): Promise<Room> {
  return apiRequest<Room>(`/rooms/${id}`, { signal });
}

export function getRoomAvailability(
  roomId: string,
  start: string,
  end: string
): Promise<RoomAvailability> {
  const params = new URLSearchParams({
    start,
    end,
  });

  return apiRequest<RoomAvailability>(
    `/rooms/${roomId}/availability?${params.toString()}`
  );
}
