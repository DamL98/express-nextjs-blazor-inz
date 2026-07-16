import {
  extractBearerToken,
  getAuthCookieName,
  verifySessionToken,
} from "../config/auth.js";
import { ApiError } from "../errors/apiError.js";
import { authService } from "../modules/auth/auth.service.js";

export async function authenticate(req, res, next) {
  const token =
    extractBearerToken(req.get("authorization")) ||
    req.cookies?.[getAuthCookieName()] || null;

  if (!token) {
    return next(new ApiError(401, "AUTH_TOKEN_REQUIRED", "Wymagane zalogowanie # brak auth tokenu"));
  }

  let session;
  try {
    session = verifySessionToken(token);
  } catch (error) {
    return next(
      new ApiError(401, "AUTH_TOKEN_INVALID", "Nieprawidlowy token lub wygasl"),
    );
  }

  try {
    const user = await authService.getCurrentUser(session.sub);
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
      return next(new ApiError(403, "FORBIDDEN", "Brak uprawnien"));
    }

    return next();
  };
}
