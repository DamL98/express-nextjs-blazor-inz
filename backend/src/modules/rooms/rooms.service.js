import { ApiError } from "../../errors/apiError.js";
import { ProblemDefinitions } from "../../errors/problemDefinitions.js";
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
    throw ApiError.from(ProblemDefinitions.ROOM_NOT_FOUND);
  }

  return room;
}

export async function checkRoomAvailability(roomId, start, end) {
  const room = await findRoomById(roomId);

  if (!room) {
    throw ApiError.from(ProblemDefinitions.ROOM_NOT_FOUND);
  }

  const startTime = new Date(start);
  const endTime = new Date(end);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw ApiError.from(ProblemDefinitions.INVALID_DATE, {
      detail: "startTime i endTime maja nieprawidlowy format",
    });
  }

  if (startTime >= endTime) {
    throw ApiError.from(ProblemDefinitions.INVALID_TIME_RANGE);
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
