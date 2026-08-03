import { BadRequestError } from "../../errors/httpErrors.js";
import { InvalidTimeRangeError } from "../../errors/dateErrors.js";
import {
  findConflictingRoomReservations,
  findManyRooms,
  findRoomById,
} from "../../repositories/room.repository.js";
import { RoomNotFoundError } from "./rooms.errors.js";

export async function getRooms(filters) {
  return findManyRooms(filters);
}

export async function getRoomById(id) {
  const room = await findRoomById(id);

  if (!room) {
    throw new RoomNotFoundError();
  }

  return room;
}

export async function checkRoomAvailability(roomId, start, end) {
  const room = await findRoomById(roomId);

  if (!room) {
    throw new RoomNotFoundError();
  }

  const startTime = new Date(start);
  const endTime = new Date(end);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new BadRequestError(
      "startTime i endTime jest błędne",
      "INVALID_DATE",
    );
  }

  if (startTime >= endTime) {
    throw new InvalidTimeRangeError();
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
