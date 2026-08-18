import jwt from "jsonwebtoken";

import {
  ConfigurationError,
  OAuthStateVerificationError,
  SessionTokenVerificationError,
} from "./config.errors.js";

// wymagane dane z .env do konfiga -> runtime-config.js
const REQUIRED_AUTH_CONFIGURATION = [
  "JWT_SECRET",
  "AUTH_COOKIE_NAME",
  "AUTH_SESSION_TTL",
  "AUTH_COOKIE_MAX_AGE_MS",
  "AUTH_SESSION_TOKEN_AUDIENCE",
  "AUTH_SESSION_TOKEN_ISSUER",
  "AUTH_TOKEN_AUDIENCE",
  "AUTH_TOKEN_TTL",
];

export function validateAuthConfiguration() {
  const missing = REQUIRED_AUTH_CONFIGURATION.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missing.length > 0) {
    throw new ConfigurationError(
      `Brak wymaganej konfiguracji auth: ${missing.join(", ")}`,
    );
  }

  const cookieMaxAge = getCookieMaxAgeMs();
  if (!Number.isFinite(cookieMaxAge) || cookieMaxAge <= 0) {
    throw new ConfigurationError(
      "AUTH_COOKIE_MAX_AGE_MS musi byc dodatnia liczba",
    );
  }
}

////////////////////////// ENV START //////////////////////////

function getJwtSecret() {
  return process.env.JWT_SECRET?.trim();
}

export function getAuthCookieName() {
  return process.env.AUTH_COOKIE_NAME?.trim();
}

export function getSessionTtl() {
  return process.env.AUTH_SESSION_TTL?.trim();
}

export function getCookieMaxAgeMs() {
  return Number(process.env.AUTH_COOKIE_MAX_AGE_MS?.trim());
}

export function getSessionTokenAudience() {
  return process.env.AUTH_SESSION_TOKEN_AUDIENCE?.trim();
}

export function getSessionTokenIssuer() {
  return process.env.AUTH_SESSION_TOKEN_ISSUER?.trim();
}

export function getOAuthStateAudience() {
  return process.env.AUTH_TOKEN_AUDIENCE?.trim();
}

export function getOAuthStateTtl() {
  return process.env.AUTH_TOKEN_TTL?.trim();
}

export function getSessionCookieOptions() {
  const maxAge = getCookieMaxAgeMs();

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

export function extractBearerToken(authorization) {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}


// JWT SESSION TOKEN
export function createSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    },
    getJwtSecret(),
    {
      audience: getSessionTokenAudience(),
      expiresIn: getSessionTtl(),
      issuer: getSessionTokenIssuer(),
    },
  );
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, getJwtSecret(), {
      audience: getSessionTokenAudience(),
      issuer: getSessionTokenIssuer(),
    });
  } catch (error) {
    throw new SessionTokenVerificationError(undefined, { cause: error });
  }
}

// GOOGLE OAUTH
export function createGoogleOAuthState(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    audience: getOAuthStateAudience(),
    expiresIn: getOAuthStateTtl(),
    issuer: getSessionTokenIssuer(),
  });
}

export function verifyGoogleOAuthState(state) {
  try {
    return jwt.verify(state, getJwtSecret(), {
      audience: getOAuthStateAudience(),
      issuer: getSessionTokenIssuer(),
    });
  } catch (error) {
    throw new OAuthStateVerificationError(undefined, { cause: error });
  }
}
