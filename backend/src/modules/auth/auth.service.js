import { Prisma } from "@prisma/client";

import { ApiError } from "../../errors/apiError.js";
import { userRepository } from "../../repositories/user.repository.js";

function fallbackName(email) {
  return email.split("@")[0];
}

export const authService = {
  async synchronizeUser(firebaseUser) {

    if(!firebaseUser.uid){
      throw new ApiError(
        403,
        "FIREBASE_ACCOUNT_INCOMPLETE",
        "Brak UID w koncie Firebase",
      )
    }

    if (!firebaseUser.email) {
      throw new ApiError(
        403,
        "FIREBASE_ACCOUNT_INCOMPLETE",
        "Brak email w koncie Firebase",
      );
    }

    const email = firebaseUser.email.trim().toLowerCase();

    try {
      return await userRepository.synchronizeFirebaseUser({
        firebaseUid: firebaseUser.uid,
        email,
        fullName: firebaseUser.name?.trim() || fallbackName(email),
        avatarUrl: firebaseUser.picture || null,
        emailVerified: Boolean(firebaseUser.email_verified),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(
          409,
          "ACCOUNT_LINK_CONFLICT",
          "E-mail jest powiązany z innym kontem",
        );
      }

      throw error;
    }
  },
};
