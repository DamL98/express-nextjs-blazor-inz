import { createHash, randomUUID } from "node:crypto";
import { getSessionCookieOptions, extractBearerToken } from "../../config/auth.js";
import { getAuthEnvironment } from "../../config/environment.js";
import { createGoogleOAuthState, verifyGoogleOAuthState, verifySessionToken } from "../../security/jwt.js";
import { authTokenRepository } from "../../repositories/auth-token.repository.js";
import { userRepository } from "../../repositories/user.repository.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";

const fingerprint = (value) => createHash("sha256").update(value).digest("hex");
const cookieName = () => `${getAuthEnvironment().cookieName}_oauth`;
const cookieOptions = () => ({ ...getSessionCookieOptions(), maxAge: 10 * 60 * 1000 });

export async function beginOAuthFlow(res, payload) {
  const state = createGoogleOAuthState({ ...payload, nonce: randomUUID() });
  await authTokenRepository.create(state, "oauth", payload.userId, new Date(Date.now() + 10 * 60 * 1000));
  res.cookie(cookieName(), fingerprint(state), cookieOptions());
  return state;
}

export async function consumeOAuthFlow(req, res, purposes) {
  try {
    const state = req.query.state;
    if (typeof state !== "string") throw new Error("Brak state");
    const payload = verifyGoogleOAuthState(state);
    if (!purposes.includes(payload.purpose) || req.cookies?.[cookieName()] !== fingerprint(state)) {
      throw new Error("Nieprawidlowy kontekst OAuth");
    }
    if (payload.userId) {
      const token = extractBearerToken(req.get("authorization")) || req.cookies?.[getAuthEnvironment().cookieName];
      const session = verifySessionToken(token);
      const user = await userRepository.findPublicUserById(payload.userId);
      if (!user || session.sub !== user.id || (session.sessionVersion ?? 0) !== user.sessionVersion || payload.sessionVersion !== user.sessionVersion) {
        throw new Error("Sesja inicjujaca polaczenie wygasla");
      }
    }
    // Usunięcie w bazie zapewnia jednorazowość również przy równoczesnych callbackach.
    await authTokenRepository.consume(state, "oauth");
    res.clearCookie(cookieName(), cookieOptions());
    return payload;
  } catch {
    throw new ApiError(Problems.AUTH_ACTION_INVALID);
  }
}
