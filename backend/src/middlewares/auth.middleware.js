import { ApiError } from "../errors/apiError.js";
import { getFirebaseAuth } from "../config/firebase.js";
import { authService } from "../modules/auth/auth.service.js";

function bearerToken(req) {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export async function authenticate(req, res, next) {
  const token = bearerToken(req);

  if (!token) {
    return next(new ApiError(401, "AUTH_TOKEN_REQUIRED", "Wymagane zalogowanie # brak auth tokenu"));
  }

  let firebaseUser;
  try {
    const checkRevoked = process.env.FIREBASE_CHECK_REVOKED_TOKENS === "true";
    firebaseUser = await getFirebaseAuth().verifyIdToken(token, checkRevoked);
  } catch (error) {
    if (error?.name === "FirebaseConfigError") {
      return next(
        new ApiError(503, "FIREBASE_NOT_CONFIGURED", error.message),
      );
    }

    return next(
      new ApiError(401, "AUTH_TOKEN_INVALID", "Nieprawidłowy token uwierzytelniający lub wygasł"),
    );
  }

  try {
    const user = await authService.synchronizeUser(firebaseUser);
    res.locals.firebaseUser = firebaseUser;
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
