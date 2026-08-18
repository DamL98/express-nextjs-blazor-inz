import { ApiResponse } from "../../utils/apiResponse.js"
import {
  cancelReservation,
  getReservations,
} from "./admin.service.js"

export async function getAdminReservations(_req, res) {
  const query = res.locals.validated.query
  const reservations = await getReservations(query)

  return ApiResponse.ok(reservations).send(res)
}

export async function cancelAdminReservation(_req, res) {
  const params = res.locals.validated.params
  const reservation = await cancelReservation(params.id)

  return ApiResponse.ok(reservation).send(res)
}
