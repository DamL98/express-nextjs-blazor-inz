import { NotFoundError } from "../errors/httpErrors.js";

export function notFoundMiddleware(req, _res, next) {
  return next(
    new NotFoundError(
      `Endpoint ${req.method} ${req.originalUrl} nie istnieje`,
      "ROUTE_NOT_FOUND",
    ),
  );
}
