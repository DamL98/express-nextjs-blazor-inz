import { ReservationStatus } from "@prisma/client"

import { ApiError } from "./../../errors/apiError.js"
import { findRoomById } from "../../repositories/room.repository.js"
import { reservationRepository } from "../../repositories/reservation.repository.js"
import { googleCalendarService } from "../google-calendar/google-calendar.service.js"

function parseTimeRange(start, end) {
  const startTime = new Date(start)
  const endTime = new Date(end)

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new ApiError(
      400,
      "INVALID_DATE_FORMAT",
      "startTime i endTime jest błędne"
    )
  }

  if (startTime >= endTime) {
    throw new ApiError(
      400,
      "INVALID_TIME_RANGE",
      "startTime musi byc wczesniej niz endTime"
    )
  }

  if (startTime < new Date()) {
    throw new ApiError(
      400,
      "RESERVATION_IN_PAST",
      "Rezerwacji nie może być w przeszłości"
    )
  }

  return {
    startTime,
    endTime,
  }
}

export const reservationsService = {
  async getMyReservations(userId, filters = {}) {
    return reservationRepository.findMany({
      ...filters,
      userId,
    })
  },

  async getMyReservationById(userId, id) {
    const reservation = await reservationRepository.findById(id)

    if (!reservation || reservation.userId !== userId) {
      throw new ApiError(
        404,
        "RESERVATION_NOT_FOUND",
        "Nie znaleziono rezerwacji"
      )
    }

    return reservation
  },

  async createReservation(userId, data) {
    const room = await findRoomById(data.roomId)

    if (!room) {
      throw new ApiError(404, "ROOM_NOT_FOUND", "Nie znaleziono sali")
    }

    if (!room.isActive) {
      throw new ApiError(
        400,
        "ROOM_INACTIVE",
        "Status sali disabled, nie mozna zarezerwować"
      )
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
      throw new ApiError(
        409,
        "ROOM_ALREADY_RESERVED",
        "Sala jest już zarezerwowana w tym terminie"
      )
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
    return googleCalendarService.syncReservation(reservation, room)
  },

  async cancelMyReservation(userId, id) {
    const reservation = await this.getMyReservationById(userId, id)

    if (reservation.status === ReservationStatus.CANCELLED) {
      return reservation
    }

    // Przy anulowaniu próbujemy posprzątać także event w Google Calendar, jeśli wcześniej został utworzony.
    const googleCalendarEventRemoved =
      await googleCalendarService.removeReservationFromCalendar(reservation)

    return reservationRepository.cancel(id, {
      clearGoogleCalendarEventId: googleCalendarEventRemoved,
    })
  },
}
