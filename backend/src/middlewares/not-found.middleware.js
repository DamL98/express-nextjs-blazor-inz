import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";

export function notFoundMiddleware(req, _res, next) {
  return next(
    new ApiError(Problems.ROUTE_NOT_FOUND, {
      detail: `Endpoint ${req.method} ${req.originalUrl} nie istnieje`,
    }),
  );
}
