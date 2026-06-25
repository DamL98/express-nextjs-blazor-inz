import { ReservationStatus } from "@prisma/client"

import { ApiError } from "../../errors/apiError.js"
import { adminRepository } from "../../repositories/admin.repository.js"

export const adminService = {
  async getReservations(filters = {}) {
    return adminRepository.findReservations(filters)
  },

  async cancelReservation(id) {
    const reservation = await adminRepository.findReservationById(id)

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

    return adminRepository.cancelReservation(id)
  },
}
