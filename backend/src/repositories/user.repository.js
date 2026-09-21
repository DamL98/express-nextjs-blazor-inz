import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";
import { prisma } from "../config/prisma.js";

const sessionUserSelect = {
  id: true,
  sessionVersion: true,
  passwordHash: true,
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

function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...profile } = user;
  return { ...profile, hasLocalPassword: Boolean(passwordHash) };
}

export const userRepository = {
  async findCredentials(email) {
    return prisma.user.findUnique({ where: { email }, include: { role: true } });
  },

  async createLocal({ email, fullName, passwordHash }) {
    return prisma.user.create({
      data: { email, fullName, passwordHash, role: { connectOrCreate: { where: { name: "user" }, create: { name: "user" } } } },
      select: sessionUserSelect,
    }).then(toPublicUser);
  },

  async touchLogin(id) {
    return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() }, select: sessionUserSelect }).then(toPublicUser);
  },

  async changePassword(id, previousHash, passwordHash) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id, passwordHash: previousHash },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      if (result.count !== 1) throw new ApiError(Problems.AUTH_SESSION_INVALID);
      await tx.authToken.deleteMany({ where: { userId: id } });
    });
  },

  async linkGoogle(id, sessionVersion, googleId) {
    try {
      const result = await prisma.user.updateMany({
        where: { id, googleId: null, sessionVersion },
        data: { googleId },
      });
      if (result.count !== 1) throw new ApiError(Problems.ACCOUNT_LINK_CONFLICT);
    } catch (error) {
      if (error.code === "P2002") throw new ApiError(Problems.ACCOUNT_LINK_CONFLICT);
      throw error;
    }
  },

  async findPublicUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: sessionUserSelect,
    }).then(toPublicUser);
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
            ...(!existingByGoogleId.passwordHash ? { fullName: data.fullName, avatarUrl: data.avatarUrl } : {}),
            lastLoginAt: new Date(),
          },
          select: sessionUserSelect,
        });
      }

      const existingByEmail = await tx.user.findUnique({
        where: { email: data.email },
      });

      if (existingByEmail) {
        throw new ApiError(Problems.ACCOUNT_LINK_CONFLICT, { detail: "Zaloguj sie dotychczasowa metoda i polacz konto Google w ustawieniach" });
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
        select: sessionUserSelect,
      });
    }).then(toPublicUser);
  },
};
