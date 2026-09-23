import { getApplicationEnvironment } from "../../config/environment.js";
import { getRateLimitConfiguration } from "../../config/rate-limit.js";

const applicationEnvironment = getApplicationEnvironment();
const rateLimitConfiguration = getRateLimitConfiguration();

export function getMeasurementInfo(_req, res, next) {
  // Poza trybem pomiarowym endpoint pozostaje niedostępny.
  if (!rateLimitConfiguration.isMeasurementModeEnabled) {
    return next();
  }

  return res.json({
    production: applicationEnvironment.isProduction,
    isolated: rateLimitConfiguration.isMeasurementDatabaseConfigured,
    rateLimitEnabled: rateLimitConfiguration.isRateLimitEnabled,
  });
}
