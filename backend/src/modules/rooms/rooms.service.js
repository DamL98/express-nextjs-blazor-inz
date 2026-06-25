import { ApiError } from "../../errors/apiError.js";
import {
  findConflictingRoomReservations,
  findManyRooms,
  findRoomById,
} from "../../repositories/room.repository.js";

export async function getRooms(filters) {
  return findManyRooms(filters);
}

export async function getRoomById(id) {
  const room = await findRoomById(id);

  if (!room) {
    throw new ApiError(404, "ROOM_NOT_FOUND", "Nie znaleziono sali");
  }

  return room;
}

export async function checkRoomAvailability(roomId, start, end) {
  const room = await findRoomById(roomId);

  if (!room) {
    throw new ApiError(404, "ROOM_NOT_FOUND", "Nie znaleziono sali");
  }

  const startTime = new Date(start);
  const endTime = new Date(end);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new ApiError(
      400,
      "INVALID_DATE",
      "startTime i endTime jest błędne",
    );
  }

  if (startTime >= endTime) {
    throw new ApiError(
      400,
      "INVALID_TIME_RANGE",
      "startTime musi byc wczesniej niz endTime",
    );
  }

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