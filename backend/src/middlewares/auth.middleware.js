import {
  extractBearerToken,
  getAuthCookieName,
  verifySessionToken,
} from "../config/auth.js";
import { ApiError } from "../errors/apiError.js";
import { ProblemDefinitions } from "../errors/problemDefinitions.js";
import { getCurrentUser } from "../modules/auth/auth.service.js";

export async function authenticate(req, res, next) {
  const token =
    extractBearerToken(req.get("authorization")) ||
    req.cookies?.[getAuthCookieName()] || null;

  if (!token) {
    return next(
      ApiError.from(ProblemDefinitions.AUTH_TOKEN_REQUIRED),
    );
  }

  let session;
  try {
    session = verifySessionToken(token);
  } catch (error) {
    return next(
      ApiError.from(ProblemDefinitions.AUTH_TOKEN_INVALID),
    );
  }

  try {
    const user = await getCurrentUser(session.sub);
    res.locals.auth = session;
    res.locals.user = user;
      return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(...allowedRoles) {
  return (_req, res, next) => {
    if (!res.locals.user || !allowedRoles.includes(res.locals.user.role.name)) {
      return next(ApiError.from(ProblemDefinitions.FORBIDDEN));
    }

    return next();
  };
}
