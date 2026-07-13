import { Prisma } from "@prisma/client";

import {
  createGoogleOAuthState,
  createSessionToken,
  getSessionTtl,
  verifyGoogleOAuthState,
} from "../../config/auth.js";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCodeForProfile,
  validateFrontendRedirectUrl,
  verifyGoogleIdToken,
} from "../../config/google-oauth.js";
import { ApiError } from "../../errors/apiError.js";
import { userRepository } from "../../repositories/user.repository.js";

function fallbackName(email) {
  return email.split("@")[0];
}

export const authService = {
  async synchronizeUser(googleUser) {
    if (!googleUser.googleId) {
      throw new ApiError(
        403,
        "GOOGLE_ACCOUNT_INCOMPLETE",
        "Brak identyfikatora konta Google",
      );
    }

    if (!googleUser.email) {
      throw new ApiError(
        403,
        "GOOGLE_ACCOUNT_INCOMPLETE",
        "Brak email w koncie Google",
      );
    }

    const email = googleUser.email.trim().toLowerCase();

    try {
      return await userRepository.synchronizeGoogleUser({
        googleId: googleUser.googleId,
        email,
        fullName: googleUser.fullName?.trim() || fallbackName(email),
        avatarUrl: googleUser.avatarUrl || null,
        emailVerified: Boolean(googleUser.emailVerified),
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiError(
          409,
          "ACCOUNT_LINK_CONFLICT",
          "E-mail jest powiazany z innym kontem",
        );
      }

      throw error;
    }
  },

  async createSessionFromGoogleIdToken(idToken) {
    const googleUser = await verifyGoogleIdToken(idToken);
    return this.createSessionFromGoogleUser(googleUser);
  },

  async createSessionFromAuthorizationCode(code, redirectUri) {
    const googleUser = await exchangeGoogleCodeForProfile(code, redirectUri);
    return this.createSessionFromGoogleUser(googleUser);
  },

  async createSessionFromGoogleUser(googleUser) {
    const user = await this.synchronizeUser(googleUser);
    const token = createSessionToken(user);

    return {
      token,
      expiresIn: getSessionTtl(),
      user,
    };
  },

  createGoogleAuthorizationUrl(redirectTo) {
    const validatedRedirectTo = validateFrontendRedirectUrl(redirectTo);
    const state = createGoogleOAuthState({
      redirectTo: validatedRedirectTo,
    });

    return buildGoogleAuthorizationUrl({ state });
  },

  readRedirectFromState(state) {
    const payload = verifyGoogleOAuthState(state);
    return validateFrontendRedirectUrl(payload?.redirectTo);
  },

  async getCurrentUser(userId) {
    const user = await userRepository.findPublicUserById(userId);

    if (!user) {
      throw new ApiError(
        401,
        "AUTH_SESSION_INVALID",
        "Sesja wygasla lub uzytkownik nie istnieje",
      );
    }

    return user;
  },
};
