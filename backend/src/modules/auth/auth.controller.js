import { extractBearerToken, getAuthCookieName, getSessionCookieOptions } from "../../config/auth.js";
import {
  getGoogleOAuthRedirectUri,
  isGoogleOAuthConfigError,
  isGoogleOAuthValidationError,
} from "../../config/google-oauth.js";
import { ApiError } from "../../errors/apiError.js";
import { successResponse } from "../../utils/api-response.js";
import { authService } from "./auth.service.js";

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

export async function getCurrentUser(_req, res) {
  return res.status(200).json(successResponse(res.locals.user));
}

export async function createSession(req, res, next) {
  const { idToken, authorizationCode, redirectUri } = sessionSource(req);

  if (!idToken && !authorizationCode) {
    return next(
      new ApiError(
        400,
        "GOOGLE_AUTH_PAYLOAD_REQUIRED",
        "Przekaz Google idToken w body Authorization lub authorizationCode",
      ),
    );
  }

  try {
    const session = idToken
      ? await authService.createSessionFromGoogleIdToken(idToken)
      : await authService.createSessionFromAuthorizationCode(authorizationCode, redirectUri);

    applySessionCookie(res, session.token);
    return res.status(200).json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (isGoogleOAuthConfigError(error)) {
      return next(new ApiError(503, "GOOGLE_OAUTH_NOT_CONFIGURED", error.message));
    }

    return next(
      new ApiError(
        401,
        "GOOGLE_AUTH_FAILED",
        "Blad uwierzytelniania OAuth",
      ),
    );
  }
}

export async function getGoogleAuthorizationUrl(req, res, next) {
  try {
    const authorizationUrl = authService.createGoogleAuthorizationUrl(req.query.redirectTo);
    return res.status(200).json(successResponse({ authorizationUrl }));
  } catch (error) {
    if (isGoogleOAuthConfigError(error)) {
      return next(new ApiError(503, "GOOGLE_OAUTH_NOT_CONFIGURED", error.message));
    }

    if (isGoogleOAuthValidationError(error)) {
      return next(new ApiError(400, "INVALID_GOOGLE_REDIRECT", error.message));
    }

    return next(new ApiError(400, "INVALID_GOOGLE_REDIRECT", error.message));
  }
}

export async function redirectToGoogleAuthorization(req, res, next) {
  try {
    const authorizationUrl = authService.createGoogleAuthorizationUrl(req.query.redirectTo);
    return res.redirect(302, authorizationUrl);
  } catch (error) {
    if (isGoogleOAuthConfigError(error)) {
      return next(new ApiError(503, "GOOGLE_OAUTH_NOT_CONFIGURED", error.message));
    }

    if (isGoogleOAuthValidationError(error)) {
      return next(new ApiError(400, "INVALID_GOOGLE_REDIRECT", error.message));
    }

    return next(new ApiError(400, "INVALID_GOOGLE_REDIRECT", error.message));
  }
}

export async function handleGoogleOAuthCallback(req, res, next) {
  if (req.query.error) {
    return next(
      new ApiError(
        401,
        "GOOGLE_AUTH_DENIED",
        `Google OAuth logowanie z bledem: ${req.query.error}`,
      ),
    );
  }

  const code = req.query.code?.toString().trim();

  if (!code) {
    return next(new ApiError(400, "GOOGLE_AUTH_CODE_REQUIRED", "Brak code w callbacku Google OAuth"));
  }

  try {
    const session = await authService.createSessionFromAuthorizationCode(
      code,
      getGoogleOAuthRedirectUri(),
    );

    applySessionCookie(res, session.token);

    if (req.query.state) {
      const redirectTo = authService.readRedirectFromState(req.query.state.toString());
      const url = new URL(redirectTo);

      url.searchParams.set("auth", "success");
      return res.redirect(302, url.toString());
    }

    return res.status(200).json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (isGoogleOAuthConfigError(error)) {
      return next(new ApiError(503, "GOOGLE_OAUTH_NOT_CONFIGURED", error.message));
    }

    return next(
      new ApiError(
        401,
        "GOOGLE_AUTH_FAILED",
        "Blad logowanie Google OAuth",
      ),
    );
  }
}

export async function logout(_req, res) {
  res.clearCookie(getAuthCookieName(), {
    ...getSessionCookieOptions(),
  });

  return res.status(200).json(successResponse({ loggedOut: true }));
}
