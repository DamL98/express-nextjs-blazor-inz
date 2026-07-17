import jwt from "jsonwebtoken";

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
      audience: getSessionTokenAudience(),
      expiresIn: getSessionTtl(),
      issuer: getSessionTokenIssuer(),
    },
  );
}

export function verifySessionToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    audience: getSessionTokenAudience(),
    issuer: getSessionTokenIssuer(),
  });
}

export function createGoogleOAuthState(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    audience: getOAuthStateAudience(),
    expiresIn: getOAuthStateTtl(),
    issuer: getSessionTokenIssuer(),
  });
}

export function verifyGoogleOAuthState(state) {
  return jwt.verify(state, getJwtSecret(), {
    audience: getOAuthStateAudience(),
    issuer: getSessionTokenIssuer(),
  });
}
