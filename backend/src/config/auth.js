import { ConfigurationError } from "./config.errors.js";
import {
  getApplicationEnvironment,
  getAuthEnvironment,
} from "./environment.js";

export function validateAuthConfiguration() {
  const config = getAuthEnvironment();
  const required = {
    JWT_SECRET: config.jwtSecret,
    AUTH_COOKIE_NAME: config.cookieName,
    AUTH_SESSION_TTL: config.sessionTtl,
    AUTH_SESSION_TOKEN_AUDIENCE: config.sessionAudience,
    AUTH_SESSION_TOKEN_ISSUER: config.sessionIssuer,
    AUTH_TOKEN_AUDIENCE: config.oauthStateAudience,
    AUTH_TOKEN_TTL: config.oauthStateTtl,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Brak wymaganej konfiguracji auth: ${missing.join(", ")}`,
    );
  }

  if (!Number.isFinite(config.cookieMaxAgeMs) || config.cookieMaxAgeMs <= 0) {
    throw new ConfigurationError(
      "AUTH_COOKIE_MAX_AGE_MS musi byc dodatnia liczba",
    );
  }
}

export function getSessionCookieOptions() {
  const auth = getAuthEnvironment();

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: getApplicationEnvironment().isProduction,
    path: "/",
    maxAge: auth.cookieMaxAgeMs,
  };
}

export function extractBearerToken(authorization) {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}
