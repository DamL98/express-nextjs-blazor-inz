import { ReservationStatus } from "@prisma/client"

import { prisma } from "../config/prisma.js"

export const adminRepository = {
  async findReservations(filters = {}) {
    const where = {}

    if (filters.roomId) {
      where.roomId = filters.roomId
    }

    if (filters.status) {
      where.status = filters.status
    }

    return prisma.reservation.findMany({
      where,
      orderBy: {
        startTime: "desc",
      },
    })
  },

  async findReservationById(id) {
    return prisma.reservation.findUnique({
      where: {
        id,
      },
    })
  },

  async cancelReservation(id) {
    return prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status: ReservationStatus.CANCELLED,
      },
    })
  },
}
