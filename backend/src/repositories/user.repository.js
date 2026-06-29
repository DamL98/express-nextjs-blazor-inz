import { prisma } from "../config/prisma.js";

const publicUserSelect = {
  id: true,
  firebaseUid: true,
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
  async synchronizeFirebaseUser(data) {
    return prisma.$transaction(async (tx) => {
      const existingByUid = await tx.user.findUnique({
        where: { firebaseUid: data.firebaseUid },
      });

      if (existingByUid) {
        return tx.user.update({
          where: { id: existingByUid.id },
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
            firebaseUid: data.firebaseUid,
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
          firebaseUid: data.firebaseUid,
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
