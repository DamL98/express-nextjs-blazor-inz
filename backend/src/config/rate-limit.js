import { ConfigurationError } from "./config.errors.js";

export function getRateLimitConfiguration() {
  const rateLimitEnabledEnvValue = process.env.RATE_LIMIT_ENABLED?.trim();
  const isMeasurementModeEnabled = process.env.MEASUREMENT_DATABASE_ONLY === "true";

  let isMeasurementDatabaseConfigured = false;

  try {
    const databaseUrl = new URL(process.env.DATABASE_URL);

    isMeasurementDatabaseConfigured = ["postgresql:", "postgres:"].includes(databaseUrl.protocol) &&
      databaseUrl.hostname === "localhost" && databaseUrl.port === "5434" &&
      databaseUrl.pathname === "/inz_measurements";
  } catch {
    // brak poprawnego adresu bazy nie pozwala wyłączyć limitera
  }

  if (rateLimitEnabledEnvValue !== undefined && rateLimitEnabledEnvValue !== "true" && rateLimitEnabledEnvValue !== "false") {
    throw new ConfigurationError("RATE_LIMIT_ENABLED musi mieć wartość true albo false");
  }

  const isRateLimitEnabled = rateLimitEnabledEnvValue !== "false";

  if (!isRateLimitEnabled && (!isMeasurementModeEnabled || !isMeasurementDatabaseConfigured)) {
    throw new ConfigurationError("Wyłączenie limitera wymaga MEASUREMENT_DATABASE_ONLY=true i bazy localhost:5434/inz_measurements");
  }

  return { isRateLimitEnabled, isMeasurementModeEnabled, isMeasurementDatabaseConfigured };
}
