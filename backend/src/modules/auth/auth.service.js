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
import { ProblemDefinitions } from "../../errors/problemDefinitions.js";
import { userRepository } from "../../repositories/user.repository.js";

function fallbackName(email) {
  return email.split("@")[0];
}

async function synchronizeGoogleUser(googleUser) {
  if (!googleUser.googleId) {
    throw ApiError.from(ProblemDefinitions.GOOGLE_ACCOUNT_INCOMPLETE, {
      detail: "Brak identyfikatora konta Google",
    });
  }

  if (!googleUser.email) {
    throw ApiError.from(ProblemDefinitions.GOOGLE_ACCOUNT_INCOMPLETE, {
      detail: "Brak adresu e-mail na koncie Google",
    });
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
      throw ApiError.from(ProblemDefinitions.ACCOUNT_LINK_CONFLICT, {
        detail: "E-mail jest powiazany z innym kontem",
      });
    }

    throw error;
  }
}

async function createSessionFromGoogleUser(googleUser) {
  const user = await synchronizeGoogleUser(googleUser);
  const token = createSessionToken(user);

  return {
    token,
    expiresIn: getSessionTtl(),
    user,
  };
}

export async function createSessionFromGoogleIdToken(idToken) {
  const googleUser = await verifyGoogleIdToken(idToken);
  return createSessionFromGoogleUser(googleUser);
}

export async function createSessionFromAuthorizationCode(code, redirectUri) {
  const googleUser = await exchangeGoogleCodeForProfile(code, redirectUri);
  return createSessionFromGoogleUser(googleUser);
}

export function createGoogleAuthorizationUrl(redirectTo) {
  const validatedRedirectTo = validateFrontendRedirectUrl(redirectTo);
  const state = createGoogleOAuthState({
    redirectTo: validatedRedirectTo,
  });

  return buildGoogleAuthorizationUrl({ state });
}

export function readRedirectFromState(state) {
  const payload = verifyGoogleOAuthState(state);
  return validateFrontendRedirectUrl(payload?.redirectTo);
}

export async function getCurrentUser(userId) {
  const user = await userRepository.findPublicUserById(userId);

  if (!user) {
    throw ApiError.from(ProblemDefinitions.AUTH_SESSION_INVALID);
  }

  return user;
}
