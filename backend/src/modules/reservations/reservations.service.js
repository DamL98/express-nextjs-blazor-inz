import { ReservationStatus } from "@prisma/client"

import { ApiError } from "../../errors/apiError.js"
import { ProblemDefinitions } from "../../errors/problemDefinitions.js"
import { findRoomById } from "../../repositories/room.repository.js"
import { reservationRepository } from "../../repositories/reservation.repository.js"
import {
  removeReservationFromCalendar,
  syncReservation,
} from "../google-calendar/google-calendar.service.js"

function parseTimeRange(start, end) {
  const startTime = new Date(start)
  const endTime = new Date(end)

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw ApiError.from(ProblemDefinitions.INVALID_DATE_FORMAT, {
      detail: "startTime i endTime maja nieprawidlowy format",
    })
  }

  if (startTime >= endTime) {
    throw ApiError.from(ProblemDefinitions.INVALID_TIME_RANGE)
  }

  if (startTime < new Date()) {
    throw ApiError.from(ProblemDefinitions.RESERVATION_IN_PAST)
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
    throw ApiError.from(ProblemDefinitions.RESERVATION_NOT_FOUND)
  }

  return reservation
}

export async function createReservation(userId, data) {
  const room = await findRoomById(data.roomId)

  if (!room) {
    throw ApiError.from(ProblemDefinitions.ROOM_NOT_FOUND)
  }

  if (!room.isActive) {
    throw ApiError.from(ProblemDefinitions.ROOM_INACTIVE)
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
    throw ApiError.from(ProblemDefinitions.ROOM_ALREADY_RESERVED)
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
