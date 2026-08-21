import { validateAuthConfiguration } from "./auth.js";
import { validateGoogleOAuthConfiguration } from "./google-oauth.js";
import { validateGoogleRefreshTokenConfiguration } from "../security/googleRefreshToken.js";

export function validateRuntimeConfiguration() {
  validateAuthConfiguration();
  validateGoogleOAuthConfiguration();
  validateGoogleRefreshTokenConfiguration();
}
