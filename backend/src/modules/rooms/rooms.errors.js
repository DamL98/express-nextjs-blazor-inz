import {
  BadRequestError,
  NotFoundError,
} from "../../errors/httpErrors.js";

export class RoomNotFoundError extends NotFoundError {
  constructor() {
    super("Nie znaleziono sali", "ROOM_NOT_FOUND");
  }
}

export class RoomInactiveError extends BadRequestError {
  constructor() {
    super(
      "Status sali disabled, nie mozna zarezerwować",
      "ROOM_INACTIVE",
    );
  }
}
