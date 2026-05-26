import { ApiError } from "../../errors/apiError.js";
import {
  findConflictingRoomReservations,
  findManyRooms,
  findRoomById,
} from "../../repositories/room.repository.js";

// lista pokoi
export async function getRooms(filters) {
  return findManyRooms(filters);
}

// pobranie konkretnego pokoju po id
export async function getRoomById(id) {
  const room = await findRoomById(id);

  if (!room) {
    throw new ApiError(404, "ROOM_NOT_FOUND", "Room not found.");
  }

  return room;
}


// dostepnosc pokoju
export async function checkRoomAvailability(roomId, start, end) {
  const room = await findRoomById(roomId);

  if (!room) {
    throw new ApiError(404, "ROOM_NOT_FOUND", "Room not found.");
  }

  // daty poprawnie zwalidowane przez Zod
  const startTime = new Date(start);
  const endTime = new Date(end);

  const conflicts = await findConflictingRoomReservations(
    roomId,
    startTime,
    endTime,
  );

  return {
    roomId,
    available: conflicts.length === 0,
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    conflicts: conflicts.map((reservation) => ({
      id: reservation.id,
      title: reservation.title,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    })),
  };
}