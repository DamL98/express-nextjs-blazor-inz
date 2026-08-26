import { prisma } from "../config/prisma.js";

export async function findManyRooms(filters = {}) {
  const where = {};

  if (filters.active !== undefined) {
    where.isActive = filters.active;
  }

  if (filters.capacityMin !== undefined) {
    where.capacity = {
      gte: filters.capacityMin,
    };
  }

  return prisma.room.findMany({
    where,
    orderBy: {
      name: "asc",
    },
  });
}

export async function findRoomById(id) {
  return prisma.room.findUnique({
    where: {
      id,
    },
  });
}

export async function findConflictingRoomReservations(roomId, startTime, endTime) {
  return prisma.reservation.findMany({
    where: {
      roomId,
      status: "ACTIVE",
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
  });
}

export async function countActiveRooms() {
  return prisma.room.count({
    where: {
      isActive: true,
    },
  });
}
