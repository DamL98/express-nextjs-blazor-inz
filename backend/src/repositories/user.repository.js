import { prisma } from "../config/prisma.js";

const publicUserSelect = {
  id: true,
  googleId: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      name: true,
    },
  },
};

export const userRepository = {
  async findPublicUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  },

  async synchronizeGoogleUser(data) {
    return prisma.$transaction(async (tx) => {
      const existingByGoogleId = await tx.user.findUnique({
        where: { googleId: data.googleId },
      });

      if (existingByGoogleId) {
        return tx.user.update({
          where: { id: existingByGoogleId.id },
          data: {
            email: data.email,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
            emailVerified: data.emailVerified,
            lastLoginAt: new Date(),
          },
          select: publicUserSelect,
        });
      }

      const existingByEmail = await tx.user.findUnique({
        where: { email: data.email },
      });

      if (existingByEmail) {
        return tx.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: data.googleId,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
            emailVerified: data.emailVerified,
            lastLoginAt: new Date(),
          },
          select: publicUserSelect,
        });
      }

      const userRole = await tx.role.upsert({
        where: { name: "user" },
        update: {},
        create: { name: "user" },
      });

      return tx.user.create({
        data: {
          googleId: data.googleId,
          email: data.email,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          emailVerified: data.emailVerified,
          lastLoginAt: new Date(),
          roleId: userRole.id,
        },
        select: publicUserSelect,
      });
    });
  },
};
