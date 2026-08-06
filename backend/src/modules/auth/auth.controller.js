import { extractBearerToken, getAuthCookieName, getSessionCookieOptions } from "../../config/auth.js";
import {
  GoogleOAuthConfigurationError,
  GoogleOAuthValidationError,
} from "../../config/config.errors.js";
import { getGoogleOAuthRedirectUri } from "../../config/google-oauth.js";
import { ApiError } from "../../errors/apiError.js";
import { ProblemDefinitions } from "../../errors/problemDefinitions.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createGoogleAuthorizationUrl,
  createSessionFromAuthorizationCode,
  createSessionFromGoogleIdToken,
  readRedirectFromState,
} from "./auth.service.js";

function sessionSource(req) {
  const body = req.body ?? {};
  const idToken = body.idToken?.trim() || extractBearerToken(req.get("authorization"));
  const authorizationCode = body.authorizationCode?.trim() || null;
  const redirectUri = body.redirectUri?.trim() || getGoogleOAuthRedirectUri();

  return {
    idToken,
    authorizationCode,
    redirectUri,
  };
}

function applySessionCookie(res, token) {
  res.cookie(getAuthCookieName(), token, getSessionCookieOptions());
}

function mapGoogleAuthenticationError(error, fallbackDetail) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof GoogleOAuthConfigurationError) {
    return ApiError.from(ProblemDefinitions.GOOGLE_OAUTH_NOT_CONFIGURED, {
      detail: error.message,
      cause: error,
    });
  }

  if (error instanceof GoogleOAuthValidationError) {
    return ApiError.from(ProblemDefinitions.GOOGLE_AUTH_FAILED, {
      detail: error.message,
      cause: error,
    });
  }

  return ApiError.from(ProblemDefinitions.GOOGLE_AUTH_FAILED, {
    detail: fallbackDetail,
    cause: error,
  });
}

function mapGoogleAuthorizationError(error) {
  if (error instanceof GoogleOAuthConfigurationError) {
    return ApiError.from(ProblemDefinitions.GOOGLE_OAUTH_NOT_CONFIGURED, {
      detail: error.message,
      cause: error,
    });
  }

  return ApiError.from(ProblemDefinitions.INVALID_GOOGLE_REDIRECT, {
    detail: error.message || "Nieprawidlowy adres przekierowania Google",
    cause: error,
  });
}

export async function getCurrentUser(_req, res) {
  return ApiResponse.ok(res.locals.user).send(res);
}

export async function createSession(req, res, next) {
  const { idToken, authorizationCode, redirectUri } = sessionSource(req);

  if (!idToken && !authorizationCode) {
    return next(
      ApiError.from(ProblemDefinitions.GOOGLE_AUTH_PAYLOAD_REQUIRED, {
        detail: "Przekaz Google idToken lub authorizationCode",
      }),
    );
  }

  try {
    const session = idToken
      ? await createSessionFromGoogleIdToken(idToken)
      : await createSessionFromAuthorizationCode(authorizationCode, redirectUri);

    applySessionCookie(res, session.token);
    return ApiResponse.ok(session).send(res);
  } catch (error) {
    return next(mapGoogleAuthenticationError(
      error,
      "Blad uwierzytelniania OAuth",
    ));
  }
}

export async function getGoogleAuthorizationUrl(req, res, next) {
  try {
    const authorizationUrl = createGoogleAuthorizationUrl(req.query.redirectTo);
    return ApiResponse.ok({ authorizationUrl }).send(res);
  } catch (error) {
    return next(mapGoogleAuthorizationError(error));
  }
}

export async function redirectToGoogleAuthorization(req, res, next) {
  try {
    const authorizationUrl = createGoogleAuthorizationUrl(req.query.redirectTo);
    return res.redirect(302, authorizationUrl);
  } catch (error) {
    return next(mapGoogleAuthorizationError(error));
  }
}

export async function handleGoogleOAuthCallback(req, res, next) {
  if (req.query.error) {
    return next(
      ApiError.from(ProblemDefinitions.GOOGLE_AUTH_DENIED, {
        detail: `Google OAuth zwrocilo blad: ${req.query.error}`,
      }),
    );
  }

  const code = req.query.code?.toString().trim();

  if (!code) {
    return next(
      ApiError.from(ProblemDefinitions.GOOGLE_AUTH_CODE_REQUIRED),
    );
  }

  try {
    const session = await createSessionFromAuthorizationCode(
      code,
      getGoogleOAuthRedirectUri(),
    );

    applySessionCookie(res, session.token);

    if (req.query.state) {
      const redirectTo = readRedirectFromState(req.query.state.toString());
      const url = new URL(redirectTo);

      url.searchParams.set("auth", "success");
      return res.redirect(302, url.toString());
    }

    return ApiResponse.ok(session).send(res);
  } catch (error) {
    return next(mapGoogleAuthenticationError(
      error,
      "Blad logowania Google OAuth",
    ));
  }
}

export async function logout(_req, res) {
  res.clearCookie(getAuthCookieName(), {
    ...getSessionCookieOptions(),
  });

  return ApiResponse.ok({ loggedOut: true }).send(res);
}
