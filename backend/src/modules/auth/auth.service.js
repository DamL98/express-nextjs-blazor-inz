import { Prisma } from "@prisma/client";

import { getAuthEnvironment } from "../../config/environment.js";
import {
  GoogleOAuthConfigurationError,
  GoogleOAuthValidationError,
  OAuthStateVerificationError,
} from "../../config/config.errors.js";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCodeForProfile,
  validateFrontendRedirectUrl,
  verifyGoogleIdToken,
} from "../../config/google-oauth.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";
import { userRepository } from "../../repositories/user.repository.js";
import {
  createGoogleOAuthState,
  createSessionToken,
  verifyGoogleOAuthState,
} from "../../security/jwt.js";

function toGoogleApiError(error, problem) {
  if (error instanceof GoogleOAuthConfigurationError) {
    return new ApiError(Problems.GOOGLE_OAUTH_NOT_CONFIGURED, {
      detail: error.message,
      cause: error,
    });
  }

  if (
    error instanceof GoogleOAuthValidationError ||
    error instanceof OAuthStateVerificationError
  ) {
    return new ApiError(problem, {
      detail: error.message,
      cause: error,
    });
  }

  return error;
}

async function synchronizeGoogleUser(googleUser) {
  if (!googleUser.googleId) {
    throw new ApiError(Problems.GOOGLE_ACCOUNT_INCOMPLETE, {
      detail: "Brak identyfikatora konta Google",
    });
  }

  if (!googleUser.email) {
    throw new ApiError(Problems.GOOGLE_ACCOUNT_INCOMPLETE, {
      detail: "Brak adresu e-mail na koncie Google",
    });
  }

  const email = googleUser.email.trim().toLowerCase();

  try {
    return await userRepository.synchronizeGoogleUser({
      googleId: googleUser.googleId,
      email,
      fullName: googleUser.fullName?.trim() || email.split("@")[0],
      avatarUrl: googleUser.avatarUrl || null,
      emailVerified: Boolean(googleUser.emailVerified),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(Problems.ACCOUNT_LINK_CONFLICT, {
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
    expiresIn: getAuthEnvironment().sessionTtl,
    user,
  };
}

export async function createSessionFromGoogleIdToken(idToken) {
  try {
    const googleUser = await verifyGoogleIdToken(idToken);
    return await createSessionFromGoogleUser(googleUser);
  } catch (error) {
    throw toGoogleApiError(error, Problems.GOOGLE_AUTH_FAILED);
  }
}

export async function createSessionFromAuthorizationCode(code, redirectUri) {
  try {
    const googleUser = await exchangeGoogleCodeForProfile(code, redirectUri);
    return await createSessionFromGoogleUser(googleUser);
  } catch (error) {
    throw toGoogleApiError(error, Problems.GOOGLE_AUTH_FAILED);
  }
}

export function createGoogleAuthorizationUrl(redirectTo) {
  try {
    const validatedRedirectTo = validateFrontendRedirectUrl(redirectTo);
    const state = createGoogleOAuthState({
      redirectTo: validatedRedirectTo,
    });

    return buildGoogleAuthorizationUrl({ state });
  } catch (error) {
    throw toGoogleApiError(error, Problems.INVALID_GOOGLE_REDIRECT);
  }
}

export function readRedirectFromState(state) {
  try {
    const payload = verifyGoogleOAuthState(state);
    return validateFrontendRedirectUrl(payload?.redirectTo);
  } catch (error) {
    throw toGoogleApiError(error, Problems.GOOGLE_AUTH_FAILED);
  }
}

export async function getCurrentUser(userId) {
  const user = await userRepository.findPublicUserById(userId);

  if (!user) {
    throw new ApiError(Problems.AUTH_SESSION_INVALID);
  }

  return user;
}
