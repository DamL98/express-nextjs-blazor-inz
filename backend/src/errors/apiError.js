import { STATUS_CODES } from "node:http";

export class ApiError extends Error {
  constructor(
    message,
    {
      statusCode = 500,
      code = "INTERNAL_SERVER_ERROR",
      statusMessage = null,
      details = null,
    } = {},
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.statusMessage =
      statusMessage ?? STATUS_CODES[statusCode] ?? "Error";
    this.code = code;
    this.details = details;

    Error.captureStackTrace?.(this, this.constructor);
  }

  toPayload() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
