import { ReservationStatus } from "@prisma/client"
import { prisma } from "../config/prisma.js"

export const reservationRepository = {
  async findMany(filters = {}) {
    const where = {}

    if (filters.userId) {
      where.userId = filters.userId
    }

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

  async findById(id) {
    return prisma.reservation.findUnique({
      where: {
        id,
      },
    })
  },

  async create(data) {
    return prisma.reservation.create({
      data,
    })
  },

  async cancel(id) {
    return prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status: ReservationStatus.CANCELLED,
      },
    })
  },

  async findConflicting(roomId, startTime, endTime) {
    return prisma.reservation.findFirst({
      where: {
        roomId,
        status: ReservationStatus.ACTIVE,
        startTime: {
          lt: endTime,
        },
        endTime: {
          gt: startTime,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })
  },
}
