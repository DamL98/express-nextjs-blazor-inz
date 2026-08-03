import { ApiError } from "./apiError.js";

export class BadRequestError extends ApiError {
  constructor(message, code = "BAD_REQUEST", details = null) {
    super(message, { statusCode: 400, code, details });
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message, code = "UNAUTHORIZED", details = null) {
    super(message, { statusCode: 401, code, details });
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Brak uprawnien", code = "FORBIDDEN", details = null) {
    super(message, { statusCode: 403, code, details });
  }
}

export class NotFoundError extends ApiError {
  constructor(message, code = "NOT_FOUND", details = null) {
    super(message, { statusCode: 404, code, details });
  }
}

export class ConflictError extends ApiError {
  constructor(message, code = "CONFLICT", details = null) {
    super(message, { statusCode: 409, code, details });
  }
}

export class TooManyRequestError extends ApiError {
  constructor(message, code = "TOO_MANY_REQUESTS", details = null) {
    super(message, { statusCode: 429, code, details });
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message, code = "SERVICE_UNAVAILABLE", details = null) {
    super(message, { statusCode: 503, code, details });
  }
}
