import { createHash } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";

const digest = (token) => createHash("sha256").update(token).digest("hex");

export const authTokenRepository = {
  async create(token, purpose, userId, expiresAt) {
    await prisma.authToken.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });

    return prisma.authToken.create({
      data: {
        tokenHash: digest(token),
        purpose,
        userId,
        expiresAt
      }
    });
  },

  async consume(token, purpose, action = async () => {}) {
    return prisma.$transaction(async (tx) => {
      const tokenHash = digest(token);
      const record = await tx.authToken.findUnique({ where: { tokenHash } });

      if (!record || record.purpose !== purpose || record.expiresAt <= new Date()) {
        throw new ApiError(Problems.AUTH_ACTION_INVALID);
      }

      const deleted = await tx.authToken.deleteMany({
        where: {
          tokenHash,
          purpose,
          expiresAt: { gt: new Date() }
        }
      });

      if (deleted.count !== 1) throw new ApiError(Problems.AUTH_ACTION_INVALID);

      return action(tx, record);
    });
  },
};
