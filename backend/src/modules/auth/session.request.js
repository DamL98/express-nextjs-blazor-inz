import { extractBearerToken } from "../../config/auth.js";
import { getAuthEnvironment } from "../../config/environment.js";

// nagłówek Bearer ma pierwszeństwo przed cookie sesji
export function readSessionToken(req) {
  return extractBearerToken(req.get("authorization")) ||
    req.cookies?.[getAuthEnvironment().cookieName] || null;
}
