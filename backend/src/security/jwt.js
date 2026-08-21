import jwt from "jsonwebtoken";

import {
  OAuthStateVerificationError,
  SessionTokenVerificationError,
} from "../config/config.errors.js";
import { getAuthEnvironment } from "../config/environment.js";

export function createSessionToken(user) {
  const auth = getAuthEnvironment();

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    },
    auth.jwtSecret,
    {
      audience: auth.sessionAudience,
      expiresIn: auth.sessionTtl,
      issuer: auth.sessionIssuer,
    },
  );
}

export function verifySessionToken(token) {
  const auth = getAuthEnvironment();

  try {
    return jwt.verify(token, auth.jwtSecret, {
      audience: auth.sessionAudience,
      issuer: auth.sessionIssuer,
    });
  } catch (error) {
    throw new SessionTokenVerificationError(undefined, { cause: error });
  }
}

export function createGoogleOAuthState(payload) {
  const auth = getAuthEnvironment();

  return jwt.sign(payload, auth.jwtSecret, {
    audience: auth.oauthStateAudience,
    expiresIn: auth.oauthStateTtl,
    issuer: auth.sessionIssuer,
  });
}

export function verifyGoogleOAuthState(state) {
  const auth = getAuthEnvironment();

  try {
    return jwt.verify(state, auth.jwtSecret, {
      audience: auth.oauthStateAudience,
      issuer: auth.sessionIssuer,
    });
  } catch (error) {
    throw new OAuthStateVerificationError(undefined, { cause: error });
  }
}
