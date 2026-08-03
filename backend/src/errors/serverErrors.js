import { ApiError } from "./apiError.js";

export class InternalServerError extends ApiError {
  constructor(details = null) {
    super("Błąd serwera", {
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
      details,
    });
  }
}
