import { validateAuthConfiguration } from "./auth.js";
import { getApplicationEnvironment, getDatabaseEnvironment } from "./environment.js";
import { ConfigurationError } from "./config.errors.js";
import { getRateLimitConfiguration } from "./rate-limit.js";
import { validateGoogleOAuthConfiguration } from "./google-oauth.js";
import { validateGoogleRefreshTokenConfiguration } from "../security/googleRefreshToken.js";

export function validateRuntimeConfiguration() {
  try {
    const databaseUrl = new URL(getDatabaseEnvironment().connectionString);
    if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
      throw new Error("Nieprawidlowy protokol bazy danych");
    }
  } catch {
    throw new ConfigurationError("Niepoprawny DATABASE_URL");
  }

  const { frontendNextUrl, frontendBlazorUrl } = getApplicationEnvironment();
  for (const frontendUrl of [frontendNextUrl, frontendBlazorUrl]) {
    try {
      const parsedFrontendUrl = new URL(frontendUrl);
      if (!["http:", "https:"].includes(parsedFrontendUrl.protocol) || parsedFrontendUrl.username || parsedFrontendUrl.password) {
        throw new Error("Nieprawidlowy adres frontendu");
      }
    } catch {
      throw new ConfigurationError("Niepoprawny FRONTEND_NEXT_URL lub FRONTEND_BLAZOR_URL");
    }
  }

  // publiczny adres API wyznacza zaufany origin dokumentacji Swagger UI
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
