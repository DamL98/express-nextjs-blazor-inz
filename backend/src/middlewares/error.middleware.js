import { randomUUID } from "node:crypto";
import { z, ZodError } from "zod";
import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";
import { GoogleRedirectValidationError } from "../config/config.errors.js";


export function errorMiddleware(error, _req, res, _next) {
  const instance = `urn:uuid:${randomUUID()}`;

  if (error instanceof ZodError) {
    const problem = Problems.VALIDATION_ERROR;

    return res
      .status(problem.status)
      .type("application/problem+json")
      .json({
        ...problem,
        instance,
        errors: z.treeifyError(error),
      });
  }

  let apiError = error;

  if (error.type === "entity.parse.failed" && error.status === 400) {
    apiError = new ApiError(Problems.INVALID_JSON);
  } else if (error.type === "entity.too.large" && error.status === 413) {
    apiError = new ApiError(Problems.PAYLOAD_TOO_LARGE);
  } else if (error instanceof GoogleRedirectValidationError) {
    apiError = new ApiError(Problems.INVALID_GOOGLE_REDIRECT);
  }

  if (!(apiError instanceof ApiError)) {
    apiError = new ApiError(Problems.INTERNAL_SERVER_ERROR, { cause: error });
  }

  return res
    .status(apiError.status)
    .type("application/problem+json")
    .json(apiError.toProblemDetails(instance));
}
