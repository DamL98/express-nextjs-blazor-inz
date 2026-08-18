import { ZodError } from "zod";

import { ApiError } from "./apiError.js";
import { ProblemDefinitions } from "./problemDefinitions.js";

export function toApiError(
  error,
  { includeDebugDetails = false } = {},
) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    return ApiError.from(ProblemDefinitions.VALIDATION_ERROR, {
      extensions: { errors: error.flatten() },
    });
  }

  const extensions = includeDebugDetails
    ? {
        debug: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        },
      }
    : {};

  return ApiError.from(ProblemDefinitions.INTERNAL_SERVER_ERROR, {
    extensions,
    cause: error,
  });
}
