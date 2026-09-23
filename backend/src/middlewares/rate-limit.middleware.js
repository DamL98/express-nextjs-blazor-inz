import { rateLimit } from "express-rate-limit";
import { getRateLimitConfiguration } from "../config/rate-limit.js";
import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";

export function createAuthRateLimiter() {
  const { isRateLimitEnabled } = getRateLimitConfiguration();

  // Tryb jest ustalany przy uruchomieniu, nigdy na podstawie żądania klienta.
  if (!isRateLimitEnabled) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(Problems.AUTH_RATE_LIMITED)),
  });
}
