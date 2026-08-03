import { ApiErrorMapper } from "../errors/apiErrorMapper.js";
import { ApiResponse } from "../utils/api-response.js";

export function errorMiddleware(error, _req, res, _next) {
  const apiError = ApiErrorMapper.unknownErrorBuilder(error, {
    includeDebugDetails: process.env.NODE_ENV === "development",
  });

  if (apiError.code === "INTERNAL_SERVER_ERROR") {
    console.error("Nieprzewidziany error:", error);
  }

  return ApiResponse.fromError(apiError).send(res);
}
