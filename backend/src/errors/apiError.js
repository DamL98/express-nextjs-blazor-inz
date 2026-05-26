export class ApiError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // flaga na odroznienie bledu api

    Error.captureStackTrace(this, this.constructor);
  }
}