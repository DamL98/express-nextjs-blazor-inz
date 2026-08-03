import { ReservationStatus } from "@prisma/client"

import { adminRepository } from "../../repositories/admin.repository.js"
import { ReservationNotFoundError } from "../reservations/reservations.errors.js"

export async function getReservations(filters = {}) {
  return adminRepository.findReservations(filters)
}

export async function cancelReservation(id) {
  const reservation = await adminRepository.findReservationById(id)

  if (!reservation) {
    throw new ReservationNotFoundError()
  }

  if (reservation.status === ReservationStatus.CANCELLED) {
    return reservation
  }

  return adminRepository.cancelReservation(id)
}
