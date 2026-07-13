import jwt from "jsonwebtoken";

const DEFAULT_AUTH_COOKIE_NAME = "reservation_auth";
const DEFAULT_SESSION_TTL = "7d";
const STATE_TOKEN_AUDIENCE = "google-oauth-state";
const STATE_TOKEN_TTL = "10m";
const SESSION_TOKEN_AUDIENCE = "reservation-api-session";
const SESSION_TOKEN_ISSUER = "reservation-system-api";

class AuthConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthConfigError";
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new AuthConfigError("Brak JWT_SECRET w configu backendu");
  }

  return secret;
}

export function getAuthCookieName() {
  return process.env.AUTH_COOKIE_NAME?.trim() || DEFAULT_AUTH_COOKIE_NAME;
}

export function getSessionTtl() {
  return process.env.AUTH_SESSION_TTL?.trim() || DEFAULT_SESSION_TTL;
}

export function getSessionCookieOptions() {
  const maxAge = Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000);

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function extractBearerToken(authorization) {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export function createSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    },
    getJwtSecret(),
    {
      audience: SESSION_TOKEN_AUDIENCE,
      expiresIn: getSessionTtl(),
      issuer: SESSION_TOKEN_ISSUER,
    },
  );
}

export function verifySessionToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    audience: SESSION_TOKEN_AUDIENCE,
    issuer: SESSION_TOKEN_ISSUER,
  });
}

export function createGoogleOAuthState(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    audience: STATE_TOKEN_AUDIENCE,
    expiresIn: STATE_TOKEN_TTL,
    issuer: SESSION_TOKEN_ISSUER,
  });
}

export function verifyGoogleOAuthState(state) {
  return jwt.verify(state, getJwtSecret(), {
    audience: STATE_TOKEN_AUDIENCE,
    issuer: SESSION_TOKEN_ISSUER,
  });
}

export { AuthConfigError };
