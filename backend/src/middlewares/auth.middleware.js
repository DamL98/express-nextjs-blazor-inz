import {
  extractBearerToken,
} from "../config/auth.js";
import { getAuthEnvironment } from "../config/environment.js";
import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";
import { getCurrentUser } from "../modules/auth/auth.service.js";
import { verifySessionToken } from "../security/jwt.js";

export async function authenticate(req, res, next) {
  const token =
    extractBearerToken(req.get("authorization")) ||
    req.cookies?.[getAuthEnvironment().cookieName] || null;

  if (!token) {
    return next(
      new ApiError(Problems.AUTH_TOKEN_REQUIRED),
    );
  }

  let session;
  try {
    session = verifySessionToken(token);
  } catch (error) {
    return next(
      new ApiError(Problems.AUTH_TOKEN_INVALID),
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
      return next(new ApiError(Problems.FORBIDDEN));
    }

    return next();
  };
}
