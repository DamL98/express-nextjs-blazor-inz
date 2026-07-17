import { prisma } from "../config/prisma.js";

const calendarIntegrationSelect = {
  id: true,
  userId: true,
  provider: true,
  calendarEmail: true,
  refreshTokenEncrypted: true,
  tokenExpiresAt: true,
  createdAt: true,
  updatedAt: true,
};

export const calendarIntegrationRepository = {
  async findByUserId(userId) {
    return prisma.calendarIntegration.findUnique({
      where: {
        userId,
      },
      select: calendarIntegrationSelect,
    });
  },

  async upsertConnection(data) {
    return prisma.calendarIntegration.upsert({
      where: {
        userId: data.userId,
      },
      update: {
        provider: data.provider,
        calendarEmail: data.calendarEmail,
        refreshTokenEncrypted: data.refreshTokenEncrypted,
        tokenExpiresAt: data.tokenExpiresAt,
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        calendarEmail: data.calendarEmail,
        refreshTokenEncrypted: data.refreshTokenEncrypted,
        tokenExpiresAt: data.tokenExpiresAt,
      },
      select: calendarIntegrationSelect,
    });
  },

  async deleteByUserId(userId) {
    return prisma.calendarIntegration.deleteMany({
      where: {
        userId,
      },
    });
  },
};
