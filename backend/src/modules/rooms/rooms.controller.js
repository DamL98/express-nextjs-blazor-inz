import { ApiResponse } from "../../utils/api-response.js";
import {
  checkRoomAvailability,
  getRoomById,
  getRooms,
} from "./rooms.service.js";

export async function getRoomsController(_req, res) {
  const filters = res.locals.validated?.query ?? {};
  const rooms = await getRooms(filters);

  return ApiResponse.ok(rooms).send(res);
}

export async function getRoomByIdController(_req, res) {
  const { id } = res.locals.validated.params;
  const room = await getRoomById(id);

  return ApiResponse.ok(room).send(res);
}

export async function getRoomAvailabilityController(_req, res) {
  const { id } = res.locals.validated.params;
  const { start, end } = res.locals.validated.query;
  const availability = await checkRoomAvailability(id, start, end);

  return ApiResponse.ok(availability).send(res);
}
