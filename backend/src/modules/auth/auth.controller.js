import { beginOAuthFlow, consumeOAuthFlow } from "./oauth-flow.http.js";
import { applySessionCookie, sendSessionResponse } from "./session.response.js";
import { checkLocalPassword } from "./local-auth.service.js";
import { userRepository } from "../../repositories/user.repository.js";
import { extractBearerToken, getSessionCookieOptions } from "../../config/auth.js";
import { getAuthEnvironment } from "../../config/environment.js";
import { buildGoogleAuthorizationUrl, exchangeGoogleCodeForProfile, validateFrontendRedirectUrl, getGoogleOAuthRedirectUri } from "../../config/google-oauth.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import {
  createSessionFromAuthorizationCode,
  createSessionFromGoogleIdToken,
} from "./auth.service.js";

function sessionSource(req, res) {
  const body = res.locals.validated.body;
  const idToken = body.idToken?.trim() || extractBearerToken(req.get("authorization"));
  const authorizationCode = body.authorizationCode?.trim() || null;
  const redirectUri = body.redirectUri?.trim() || getGoogleOAuthRedirectUri();

  return {
    idToken,
    authorizationCode,
    redirectUri,
  };
}

export async function getCurrentUser(_req, res) {
  return ApiResponse.ok(res.locals.user).send(res);
}

export async function createSession(req, res, next) {
  const { idToken, authorizationCode, redirectUri } = sessionSource(req, res);

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

    return sendSessionResponse(res, session);
  } catch (error) {
    return next(error);
  }
}

async function startLoginFlow(req, res) {
  const redirectTo = validateFrontendRedirectUrl(req.query.redirectTo);
  const state = await beginOAuthFlow(res, { purpose: "google-login", redirectTo });

  return buildGoogleAuthorizationUrl({ state });
}

export async function getGoogleAuthorizationUrl(req, res) {
  return ApiResponse.ok({ authorizationUrl: await startLoginFlow(req, res) }).send(res);
}

export async function redirectToGoogleAuthorization(req, res) {
  return res.redirect(302, await startLoginFlow(req, res));
}

export async function startGoogleLink(_req, res) {
  const { password, redirectTo } = res.locals.validated.body;

  const user = await checkLocalPassword(res.locals.user.email, password);
  if (!user.emailVerified) throw new ApiError(Problems.AUTH_EMAIL_UNVERIFIED);
  if (user.googleId) throw new ApiError(Problems.ACCOUNT_LINK_CONFLICT);

  const state = await beginOAuthFlow(res, {
    purpose: "google-link", userId: user.id, sessionVersion: user.sessionVersion,
    redirectTo: validateFrontendRedirectUrl(redirectTo),
  });

  return ApiResponse
  .ok({ authorizationUrl: buildGoogleAuthorizationUrl({ state }) })
  .send(res);
}

export async function handleGoogleOAuthCallback(req, res) {
  const payload = await consumeOAuthFlow(req, res, ["google-login", "google-link"]);
  const url = new URL(validateFrontendRedirectUrl(payload.redirectTo));
  const parameter = payload.purpose === "google-link" ? "googleLink" : "auth";

  try {
    if (req.query.error) throw new ApiError(Problems.GOOGLE_AUTH_DENIED);

    const code = typeof req.query.code === "string" ? req.query.code.trim() : "";
    if (!code) throw new ApiError(Problems.GOOGLE_AUTH_CODE_REQUIRED);

    if (payload.purpose === "google-link") {
      const profile = await exchangeGoogleCodeForProfile(code, getGoogleOAuthRedirectUri());
      if (!profile.emailVerified || !profile.googleId) throw new ApiError(Problems.GOOGLE_ACCOUNT_INCOMPLETE);

      await userRepository.linkGoogle(payload.userId, payload.sessionVersion, profile.googleId);
    } else {
      const session = await createSessionFromAuthorizationCode(code, getGoogleOAuthRedirectUri());
      applySessionCookie(res, session.token);
    }
    url.searchParams.set(parameter, "success");
    url.searchParams.delete("reason");

  } catch (error) {
    url.searchParams.set(parameter, "error");
    url.searchParams.set("reason", error instanceof ApiError ? error.code.toLowerCase() : "google_auth_failed");
  }

  return res.redirect(302, url.toString());
}

export async function logout(_req, res) {
  res.clearCookie(getAuthEnvironment().cookieName, {
    ...getSessionCookieOptions(),
  });

  return ApiResponse
  .ok({ loggedOut: true })
  .send(res);
}
