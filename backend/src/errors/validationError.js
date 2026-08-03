import { BadRequestError } from "./httpErrors.js";

export class ValidationError extends BadRequestError {
  constructor(message = "Błędne dane wejściowe", details = null) {
    super(message, "VALIDATION_ERROR", details);
  }

  static fromZod(error) {
    return new ValidationError("Błędne dane wejściowe", error.flatten());
  }
}
