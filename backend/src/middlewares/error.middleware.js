import { randomUUID } from "node:crypto";

import { toApiError } from "../errors/apiErrorMapper.js";
import { ApiResponse } from "../utils/apiResponse.js";

export function errorMiddleware(error, _req, res, _next) {
  const apiError = toApiError(error, {
    includeDebugDetails: process.env.NODE_ENV === "development",
  });

  if (apiError.code === "INTERNAL_SERVER_ERROR") {
    console.error("Nieprzewidziany error:", error);
  }

  return ApiResponse.problem(apiError, `urn:uuid:${randomUUID()}`).send(res);
}
