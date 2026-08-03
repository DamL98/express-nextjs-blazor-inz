import { BadRequestError } from "./httpErrors.js";

export class InvalidTimeRangeError extends BadRequestError {
  constructor() {
    super(
      "startTime musi byc wczesniej niz endTime",
      "INVALID_TIME_RANGE",
    );
  }
}
