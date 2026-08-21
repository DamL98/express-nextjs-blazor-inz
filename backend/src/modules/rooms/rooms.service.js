import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";
import {
  findConflictingRoomReservations,
  findManyRooms,
  findRoomById,
} from "../../repositories/room.repository.js";
import { parseTimeRange } from "../../shared/timeRange.js";

export async function getRooms(filters) {
  return findManyRooms(filters);
}

export async function getRoomById(id) {
  const room = await findRoomById(id);

  if (!room) {
    throw new ApiError(Problems.ROOM_NOT_FOUND);
  }

  return room;
}

export async function checkRoomAvailability(roomId, start, end) {
  const room = await findRoomById(roomId);

  if (!room) {
    throw new ApiError(Problems.ROOM_NOT_FOUND);
  }

  const { startTime, endTime } = parseTimeRange(start, end);

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
