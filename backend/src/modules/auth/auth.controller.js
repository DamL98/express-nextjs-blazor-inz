import { extractBearerToken, getAuthCookieName, getSessionCookieOptions } from "../../config/auth.js";
import {
  GoogleOAuthConfigurationError,
  GoogleOAuthValidationError,
} from "../../config/config.errors.js";
import { getGoogleOAuthRedirectUri } from "../../config/google-oauth.js";
import { ApiError } from "../../errors/apiError.js";
import {
  BadRequestError,
  ServiceUnavailableError,
  UnauthorizedError,
} from "../../errors/httpErrors.js";
import { ApiResponse } from "../../utils/api-response.js";
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

export async function getCurrentUser(_req, res) {
  return ApiResponse.ok(res.locals.user).send(res);
}

export async function createSession(req, res, next) {
  const { idToken, authorizationCode, redirectUri } = sessionSource(req);

  if (!idToken && !authorizationCode) {
    return next(
      new BadRequestError(
        "Przekaz Google idToken w body Authorization lub authorizationCode",
        "GOOGLE_AUTH_PAYLOAD_REQUIRED",
      ),
    );
  }

  try {
    const session = idToken
      ? await createSessionFromGoogleIdToken(idToken)
      : await createSessionFromAuthorizationCode(authorizationCode, redirectUri);

    applySessionCookie(res, session.token);
    return ApiResponse.ok(session).send(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (error instanceof GoogleOAuthConfigurationError) {
      return next(
        new ServiceUnavailableError(
          error.message,
          "GOOGLE_OAUTH_NOT_CONFIGURED",
        ),
      );
    }

    if (error instanceof GoogleOAuthValidationError) {
      return next(
        new UnauthorizedError(error.message, "GOOGLE_AUTH_FAILED"),
      );
    }

    return next(
      new UnauthorizedError(
        "Blad uwierzytelniania OAuth",
        "GOOGLE_AUTH_FAILED",
      ),
    );
  }
}

export async function getGoogleAuthorizationUrl(req, res, next) {
  try {
    const authorizationUrl = createGoogleAuthorizationUrl(req.query.redirectTo);
    return ApiResponse.ok({ authorizationUrl }).send(res);
  } catch (error) {
    if (error instanceof GoogleOAuthConfigurationError) {
      return next(
        new ServiceUnavailableError(
          error.message,
          "GOOGLE_OAUTH_NOT_CONFIGURED",
        ),
      );
    }

    if (error instanceof GoogleOAuthValidationError) {
      return next(
        new BadRequestError(error.message, "INVALID_GOOGLE_REDIRECT"),
      );
    }

    return next(
      new BadRequestError(error.message, "INVALID_GOOGLE_REDIRECT"),
    );
  }
}

export async function redirectToGoogleAuthorization(req, res, next) {
  try {
    const authorizationUrl = createGoogleAuthorizationUrl(req.query.redirectTo);
    return res.redirect(302, authorizationUrl);
  } catch (error) {
    if (error instanceof GoogleOAuthConfigurationError) {
      return next(
        new ServiceUnavailableError(
          error.message,
          "GOOGLE_OAUTH_NOT_CONFIGURED",
        ),
      );
    }

    if (error instanceof GoogleOAuthValidationError) {
      return next(
        new BadRequestError(error.message, "INVALID_GOOGLE_REDIRECT"),
      );
    }

    return next(
      new BadRequestError(error.message, "INVALID_GOOGLE_REDIRECT"),
    );
  }
}

export async function handleGoogleOAuthCallback(req, res, next) {
  if (req.query.error) {
    return next(
      new UnauthorizedError(
        `Google OAuth logowanie z bledem: ${req.query.error}`,
        "GOOGLE_AUTH_DENIED",
      ),
    );
  }

  const code = req.query.code?.toString().trim();

  if (!code) {
    return next(
      new BadRequestError(
        "Brak code w callbacku Google OAuth",
        "GOOGLE_AUTH_CODE_REQUIRED",
      ),
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
    if (error instanceof ApiError) {
      return next(error);
    }

    if (error instanceof GoogleOAuthConfigurationError) {
      return next(
        new ServiceUnavailableError(
          error.message,
          "GOOGLE_OAUTH_NOT_CONFIGURED",
        ),
      );
    }

    if (error instanceof GoogleOAuthValidationError) {
      return next(
        new UnauthorizedError(error.message, "GOOGLE_AUTH_FAILED"),
      );
    }

    return next(
      new UnauthorizedError(
        "Blad logowanie Google OAuth",
        "GOOGLE_AUTH_FAILED",
      ),
    );
  }
}

export async function logout(_req, res) {
  res.clearCookie(getAuthCookieName(), {
    ...getSessionCookieOptions(),
  });

  return ApiResponse.ok({ loggedOut: true }).send(res);
}
