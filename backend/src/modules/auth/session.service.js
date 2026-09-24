import { verifySessionToken } from "../../security/jwt.js";
import { getCurrentUser } from "./auth.service.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";

// weryfikuje token niezależnie od sposobu przesłania go do aplikacji
export async function verifySession(sessionToken) {
  if (!sessionToken) throw new ApiError(Problems.AUTH_TOKEN_REQUIRED);

  let sessionClaims;
  try {
    sessionClaims = verifySessionToken(sessionToken);
  } catch {
    throw new ApiError(Problems.AUTH_TOKEN_INVALID);
  }

  const sessionUser = await getCurrentUser(sessionClaims.sub);
  if ((sessionClaims.sessionVersion ?? 0) !== sessionUser.sessionVersion) {
    throw new ApiError(Problems.AUTH_SESSION_INVALID);
  }

  return { sessionClaims, sessionUser };
}
