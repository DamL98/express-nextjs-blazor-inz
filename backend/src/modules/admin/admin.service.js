import { ReservationStatus } from "@prisma/client"

import { ApiError } from "../../errors/apiError.js"
import { Problems } from "../../errors/problems.js"
import { adminRepository } from "../../repositories/admin.repository.js"

export async function getReservations(filters = {}) {
  return adminRepository.findReservations(filters)
}

export async function cancelReservation(id) {
  const reservation = await adminRepository.findReservationById(id)

  if (!reservation) {
    throw new ApiError(Problems.RESERVATION_NOT_FOUND)
  }

  if (reservation.status === ReservationStatus.CANCELLED) {
    return reservation
  }

  return adminRepository.cancelReservation(id)
}
