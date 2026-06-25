import { successResponse } from "../../utils/api-response.js"
import { adminService } from "./admin.service.js"

export async function getAdminReservations(_req, res) {
  const query = res.locals.validated.query
  const reservations = await adminService.getReservations(query)

  return res.status(200).json(successResponse(reservations))
}

export async function cancelAdminReservation(_req, res) {
  const params = res.locals.validated.params
  const reservation = await adminService.cancelReservation(params.id)

  return res.status(200).json(successResponse(reservation))
}
