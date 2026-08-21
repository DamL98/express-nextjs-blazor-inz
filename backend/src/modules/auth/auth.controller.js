import { extractBearerToken, getSessionCookieOptions } from "../../config/auth.js";
import { getAuthEnvironment } from "../../config/environment.js";
import { getGoogleOAuthRedirectUri } from "../../config/google-oauth.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";
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
  res.cookie(
    getAuthEnvironment().cookieName,
    token,
    getSessionCookieOptions(),
  );
}

export async function getCurrentUser(_req, res) {
  return ApiResponse.ok(res.locals.user).send(res);
}

export async function createSession(req, res, next) {
  const { idToken, authorizationCode, redirectUri } = sessionSource(req);

  if (!idToken && !authorizationCode) {
    return next(
      new ApiError(Problems.GOOGLE_AUTH_PAYLOAD_REQUIRED, {
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
    return next(error);
  }
}

export async function getGoogleAuthorizationUrl(req, res, next) {
  try {
    const authorizationUrl = createGoogleAuthorizationUrl(req.query.redirectTo);
    return ApiResponse.ok({ authorizationUrl }).send(res);
  } catch (error) {
    return next(error);
  }
}

export async function redirectToGoogleAuthorization(req, res, next) {
  try {
    const authorizationUrl = createGoogleAuthorizationUrl(req.query.redirectTo);
    return res.redirect(302, authorizationUrl);
  } catch (error) {
    return next(error);
  }
}

export async function handleGoogleOAuthCallback(req, res, next) {
  if (req.query.error) {
    return next(
      new ApiError(Problems.GOOGLE_AUTH_DENIED, {
        detail: `Google OAuth zwrocilo blad: ${req.query.error}`,
      }),
    );
  }

  const code = req.query.code?.toString().trim();

  if (!code) {
    return next(
      new ApiError(Problems.GOOGLE_AUTH_CODE_REQUIRED),
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
    return next(error);
  }
}

export async function logout(_req, res) {
  res.clearCookie(getAuthEnvironment().cookieName, {
    ...getSessionCookieOptions(),
  });

  return ApiResponse.ok({ loggedOut: true }).send(res);
}
