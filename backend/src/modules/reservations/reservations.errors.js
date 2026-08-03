import {
  ConflictError,
  NotFoundError,
} from "../../errors/httpErrors.js";

export class ReservationNotFoundError extends NotFoundError {
  constructor() {
    super("Nie znaleziono rezerwacji", "RESERVATION_NOT_FOUND");
  }
}

export class RoomAlreadyReservedError extends ConflictError {
  constructor() {
    super(
      "Sala jest już zarezerwowana w tym terminie",
      "ROOM_ALREADY_RESERVED",
    );
  }
}
