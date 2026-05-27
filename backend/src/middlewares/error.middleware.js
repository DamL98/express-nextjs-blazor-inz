import { ZodError } from "zod";
import { ApiError } from "../errors/apiError.js";
import { errorResponse } from "../utils/api-response.js";

export function errorMiddleware(error, _req, res, _next) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json(
      errorResponse(
        error.code,
        error.message,
        error.details ?? null,
      ),
    );
  }

  if (error instanceof ZodError) {
    return res.status(400).json(
      errorResponse(
        "VALIDATION_ERROR",
        "Dane wejściowe są niepoprawne.",
        error.flatten(),
      ),
    );
  }

  if (error?.statusCode && error?.code) {
    return res.status(error.statusCode).json(
      errorResponse(
        error.code,
        error.message || "Blad aplikacji",
        error.details ?? null,
      ),
    );
  }

  console.error("Nieprzewidziany error:", error);

  return res.status(500).json(
    errorResponse(
      "INTERNAL_SERVER_ERROR",
      "Wystąpił nieoczekiwany błąd serwera.",
      process.env.NODE_ENV === "development"
        ? {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
          }
        : null,
    ),
  );
}
