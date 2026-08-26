import { randomUUID } from "node:crypto";
import { z, ZodError } from "zod";

import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";

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

  if (!(apiError instanceof ApiError)) {
    console.error("Nieprzewidziany błąd:", error);
    apiError = new ApiError(Problems.INTERNAL_SERVER_ERROR, { cause: error });
  }

  return res
    .status(apiError.status)
    .type("application/problem+json")
    .json(apiError.toProblemDetails(instance));
}
