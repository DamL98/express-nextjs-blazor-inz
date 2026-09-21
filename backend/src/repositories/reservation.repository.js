import { Prisma, ReservationStatus } from "@prisma/client"
import { prisma } from "../config/prisma.js"
import { ApiError } from "../errors/apiError.js"
import { Problems } from "../errors/problems.js"

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

  async findNextActiveForUser(userId, limit = 3) {
    return prisma.reservation.findMany({
      where: {
        userId,
        status: ReservationStatus.ACTIVE,
      },
      orderBy: {
        startTime: "asc",
      },
      take: limit,
    })
  },

  // blokada nadpisywania rezerwacji w jednym czasie
  async create(data) {
    return prisma.$transaction(async (tx) => {
      // transkacja blokuje pomieszczenie nawet jesli nie ma jeszcze rezerwacji
      // trzyma blokade rezerwacji dopoki sprawdzenie zapisu sie nie ukonczylo
      const [room] = await tx.$queryRaw`
        SELECT id, is_active FROM rooms WHERE id = ${data.roomId} FOR UPDATE
      `
      if (!room) throw new ApiError(Problems.ROOM_NOT_FOUND)
      if (!room.is_active) throw new ApiError(Problems.ROOM_INACTIVE)

      const conflict = await tx.reservation.findFirst({
        where: {
          roomId: data.roomId,
          status: ReservationStatus.ACTIVE,
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime },
        },
      })
      if (conflict) throw new ApiError(Problems.ROOM_ALREADY_RESERVED)

      return tx.reservation.create({ data })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted })
  },

  async cancel(id, options = {}) {
    const clearGoogleCalendarEventId =
      options.clearGoogleCalendarEventId === true;

    return prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status: ReservationStatus.CANCELLED,
        ...(clearGoogleCalendarEventId
          ? { googleCalendarEventId: null }
          : {}),
      },
    })
  },

  async setGoogleCalendarEventId(id, googleCalendarEventId) {
    return prisma.reservation.update({
      where: {
        id,
      },
      data: {
        googleCalendarEventId,
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
