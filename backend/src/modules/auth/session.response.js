import { getSessionCookieOptions } from "../../config/auth.js";
import { getAuthEnvironment } from "../../config/environment.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export function applySessionCookie(res, sessionToken) {
  res.cookie(
    getAuthEnvironment().cookieName,
    sessionToken,
    getSessionCookieOptions()
  );
}

// Callback OAuth ustawia samo cookie i przekierowuje; operacje JSON zwracają sesję
export function sendSessionResponse(res, userSession) {
  applySessionCookie(res, userSession.token);

  return ApiResponse
  .ok(userSession)
  .send(res);
}
