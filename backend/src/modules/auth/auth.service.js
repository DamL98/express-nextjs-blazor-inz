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
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "../../errors/httpErrors.js";
import { userRepository } from "../../repositories/user.repository.js";

function fallbackName(email) {
  return email.split("@")[0];
}

async function synchronizeGoogleUser(googleUser) {
  if (!googleUser.googleId) {
    throw new ForbiddenError(
      "Brak identyfikatora konta Google",
      "GOOGLE_ACCOUNT_INCOMPLETE",
    );
  }

  if (!googleUser.email) {
    throw new ForbiddenError(
      "Brak email w koncie Google",
      "GOOGLE_ACCOUNT_INCOMPLETE",
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
      throw new ConflictError(
        "E-mail jest powiazany z innym kontem",
        "ACCOUNT_LINK_CONFLICT",
      );
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
    throw new UnauthorizedError(
      "Sesja wygasla lub uzytkownik nie istnieje",
      "AUTH_SESSION_INVALID",
    );
  }

  return user;
}
