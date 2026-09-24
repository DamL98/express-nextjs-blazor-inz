import { getSessionCookieOptions } from "../../config/auth.js";
import { getAuthEnvironment } from "../../config/environment.js";
import { hashAuthToken } from "../../security/authToken.js";
import { readSessionToken } from "./session.request.js";
import { createOAuthFlow, verifyAndConsumeOAuthFlow } from "./oauth-flow.service.js";

const oauthCookieName = () => `${getAuthEnvironment().cookieName}_oauth`;
const oauthCookieOptions = () => ({ ...getSessionCookieOptions(), maxAge: 10 * 60 * 1000 });

// Adapter HTTP odpowiada za odczyt requestu i obsługe cookie OAuth
export async function beginOAuthFlow(res, payload) {
  const state = await createOAuthFlow(payload);
  res.cookie(oauthCookieName(), hashAuthToken(state), oauthCookieOptions());
  return state;
}

export async function consumeOAuthFlow(req, res, purposes) {
  const payload = await verifyAndConsumeOAuthFlow({
    state: req.query.state,
    cookieFingerprint: req.cookies?.[oauthCookieName()],
    sessionToken: readSessionToken(req),
  }, purposes);

  res.clearCookie(oauthCookieName(), oauthCookieOptions());
  return payload;
}
