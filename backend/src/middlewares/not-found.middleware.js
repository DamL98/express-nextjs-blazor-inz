import { ApiError } from "../errors/apiError.js";
import { ProblemDefinitions } from "../errors/problemDefinitions.js";

export function notFoundMiddleware(req, _res, next) {
  return next(
    ApiError.from(ProblemDefinitions.ROUTE_NOT_FOUND, {
      detail: `Endpoint ${req.method} ${req.originalUrl} nie istnieje`,
    }),
  );
}
