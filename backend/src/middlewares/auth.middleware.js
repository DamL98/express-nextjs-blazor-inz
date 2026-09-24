import { verifySession } from "../modules/auth/session.service.js";
import { readSessionToken } from "../modules/auth/session.request.js";
import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";

export async function authenticate(req, res, next) {
  try {
    const sessionToken = readSessionToken(req);
    const { sessionClaims, sessionUser } = await verifySession(sessionToken);
    res.locals.auth = sessionClaims;
    res.locals.user = sessionUser;

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
