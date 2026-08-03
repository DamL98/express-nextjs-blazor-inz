import { ReservationStatus } from "@prisma/client"

import { BadRequestError } from "../../errors/httpErrors.js"
import { InvalidTimeRangeError } from "../../errors/dateErrors.js"
import { findRoomById } from "../../repositories/room.repository.js"
import { reservationRepository } from "../../repositories/reservation.repository.js"
import {
  removeReservationFromCalendar,
  syncReservation,
} from "../google-calendar/google-calendar.service.js"
import { RoomInactiveError, RoomNotFoundError } from "../rooms/rooms.errors.js"
import {
  ReservationNotFoundError,
  RoomAlreadyReservedError,
} from "./reservations.errors.js"

function parseTimeRange(start, end) {
  const startTime = new Date(start)
  const endTime = new Date(end)

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new BadRequestError(
      "startTime i endTime jest błędne",
      "INVALID_DATE_FORMAT",
    )
  }

  if (startTime >= endTime) {
    throw new InvalidTimeRangeError()
  }

  if (startTime < new Date()) {
    throw new BadRequestError(
      "Rezerwacji nie może być w przeszłości",
      "RESERVATION_IN_PAST",
    )
  }

  return {
    startTime,
    endTime,
  }
}

export async function getMyReservations(userId, filters = {}) {
  return reservationRepository.findMany({
    ...filters,
    userId,
  })
}

export async function getMyReservationById(userId, id) {
  const reservation = await reservationRepository.findById(id)

  if (!reservation || reservation.userId !== userId) {
    throw new ReservationNotFoundError()
  }

  return reservation
}

export async function createReservation(userId, data) {
  const room = await findRoomById(data.roomId)

  if (!room) {
    throw new RoomNotFoundError()
  }

  if (!room.isActive) {
    throw new RoomInactiveError()
  }

  const { startTime, endTime } = parseTimeRange(
    data.startTime,
    data.endTime
  )

  const conflict = await reservationRepository.findConflicting(
    data.roomId,
    startTime,
    endTime
  )

  if (conflict) {
    throw new RoomAlreadyReservedError()
  }

  const reservation = await reservationRepository.create({
    userId,
    roomId: data.roomId,
    title: data.title,
    description: data.description,
    startTime,
    endTime,
  })

  // Sama rezerwacja pozostaje główną operacją; synchronizacja z Google jest krokiem dodatkowym po jej utworzeniu.
  return syncReservation(reservation, room)
}

export async function cancelMyReservation(userId, id) {
  const reservation = await getMyReservationById(userId, id)

  if (reservation.status === ReservationStatus.CANCELLED) {
    return reservation
  }

  // Przy anulowaniu próbujemy posprzątać także event w Google Calendar, jeśli wcześniej został utworzony.
  const googleCalendarEventRemoved =
    await removeReservationFromCalendar(reservation)

  return reservationRepository.cancel(id, {
    clearGoogleCalendarEventId: googleCalendarEventRemoved,
  })
}
