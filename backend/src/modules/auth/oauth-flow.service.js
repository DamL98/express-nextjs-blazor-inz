import { randomUUID } from "node:crypto";
import { createGoogleOAuthState, verifyGoogleOAuthState } from "../../security/jwt.js";
import { hashAuthToken } from "../../security/authToken.js";
import { verifySession } from "./session.service.js";
import { authTokenRepository } from "../../repositories/auth-token.repository.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";

export async function createOAuthFlow(payload) {
  const state = createGoogleOAuthState({
    ...payload,
    nonce: randomUUID() }
  );

  await authTokenRepository.create(
    state,
    "oauth",
     payload.userId,
     new Date(Date.now() + 10 * 60 * 1000)
  );

  return state;
}

export async function verifyAndConsumeOAuthFlow({ state, cookieFingerprint, sessionToken }, purposes) {
  try {
    if (typeof state !== "string") throw new Error("Brak state");

    const payload = verifyGoogleOAuthState(state);
    if (!purposes.includes(payload.purpose) || cookieFingerprint !== hashAuthToken(state)) {
      throw new Error("Nieprawidlowy kontekst OAuth");
    }

    if (payload.userId) {
      const { sessionUser } = await verifySession(sessionToken);
      if (payload.userId !== sessionUser.id || payload.sessionVersion !== sessionUser.sessionVersion) {
        throw new Error("Sesja inicjujaca polaczenie wygasla");
      }
    }

    await authTokenRepository.consume(state, "oauth");

    return payload;
  } catch {
    throw new ApiError(Problems.AUTH_ACTION_INVALID);
  }
}
