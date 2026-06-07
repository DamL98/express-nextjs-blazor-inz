import { ReservationStatus } from "@prisma/client"

import { ApiError } from "./../../errors/apiError.js"
import { findRoomById } from "../../repositories/room.repository.js"
import { reservationRepository } from "../../repositories/reservation.repository.js"

const MOCK_USER_EMAIL = "user@example.com"

async function getMockUser() {
  const user = await reservationRepository.findUserByEmail(MOCK_USER_EMAIL)

  if (!user) {
    throw new ApiError(
      500,
      "MOCK_USER_NOT_FOUND",
      "Blad demo user nie znaleziony"
    )
  }

  return user
}

function parseTimeRange(start, end) {
  const startTime = new Date(start)
  const endTime = new Date(end)

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new ApiError(
      400,
      "INVALID_DATE_FORMAT",
      "startTime i endTime jest invalid"
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
      "Reservation cannot start in the past."
    )
  }

  return {
    startTime,
    endTime,
  }
}

export const reservationsService = {
  async getMyReservations(filters = {}) {
    const user = await getMockUser()

    return reservationRepository.findMany({
      ...filters,
      userId: user.id,
    })
  },

  async getAllReservations(filters = {}) {
    return reservationRepository.findMany(filters)
  },

  async getMyReservationById(id) {
    const user = await getMockUser()
    const reservation = await reservationRepository.findById(id)

    if (!reservation || reservation.userId !== user.id) {
      throw new ApiError(
        404,
        "RESERVATION_NOT_FOUND",
        "Nie znaleziono rezerwacji"
      )
    }

    return reservation
  },

  async createReservation(data) {
    const user = await getMockUser()
    const room = await findRoomById(data.roomId)

    if (!room) {
      throw new ApiError(404, "ROOM_NOT_FOUND", "Nie znaleziono sali")
    }

    if (!room.isActive) {
      throw new ApiError(
        400,
        "ROOM_INACTIVE",
        "Sala jest disabled, nie mozna zarezerwować"
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

    return reservationRepository.create({
      userId: user.id,
      roomId: data.roomId,
      title: data.title,
      description: data.description,
      startTime,
      endTime,
    })
  },

  async cancelMyReservation(id) {
    const reservation = await this.getMyReservationById(id)

    if (reservation.status === ReservationStatus.CANCELLED) {
      return reservation
    }

    return reservationRepository.cancel(id)
  },

  async cancelReservation(id) {
    const reservation = await reservationRepository.findById(id)

    if (!reservation) {
      throw new ApiError(
        404,
        "RESERVATION_NOT_FOUND",
        "Nie znaleziono rezerwacji"
      )
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      return reservation
    }

    return reservationRepository.cancel(id)
  },
}
