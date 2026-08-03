import { ZodError } from "zod";

import { ApiError } from "./apiError.js";
import { InternalServerError } from "./serverErrors.js";
import { ValidationError } from "./validationError.js";

export class ApiErrorMapper {
  static unknownErrorBuilder(error, { includeDebugDetails = false } = {}) {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof ZodError) {
      return ValidationError.fromZod(error);
    }

    if (Number.isInteger(error?.statusCode) && error?.code) {
      return new ApiError(error.message || "Błąd aplikacji", {
        statusCode: error.statusCode,
        statusMessage: error.statusMessage,
        code: error.code,
        details: error.details ?? null,
      });
    }

    const details = includeDebugDetails
      ? {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        }
      : null;

    return new InternalServerError(details);
  }
}
