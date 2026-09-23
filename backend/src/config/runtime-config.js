import { validateAuthConfiguration } from "./auth.js";
import { getApplicationEnvironment } from "./environment.js";
import { ConfigurationError } from "./config.errors.js";
import { getRateLimitConfiguration } from "./rate-limit.js";
import { validateGoogleOAuthConfiguration } from "./google-oauth.js";
import { validateGoogleRefreshTokenConfiguration } from "../security/googleRefreshToken.js";

export function validateRuntimeConfiguration() {
  // Publiczny adres API wyznacza zaufany origin dokumentacji Swagger UI.
  try {
    const apiPublicUrl = new URL(getApplicationEnvironment().apiPublicUrl);
    if (!["http:", "https:"].includes(apiPublicUrl.protocol) || apiPublicUrl.username || apiPublicUrl.password) {
      throw new Error("Nieprawidłowy adres API");
    }
  } catch {
    throw new ConfigurationError("Niepoprawny API_PUBLIC_URL");
  }

  getRateLimitConfiguration();
  validateAuthConfiguration();
  validateGoogleOAuthConfiguration();
  validateGoogleRefreshTokenConfiguration();
}
