import { ApiResponse } from "../../utils/apiResponse.js"
import {
  cancelMyReservation as cancelMyReservationService,
  createReservation as createReservationService,
  getMyReservationById as getMyReservationByIdService,
  getMyReservations as getMyReservationsService,
} from "./reservations.service.js"

export async function getMyReservations(_req, res) {
  const query = res.locals.validated.query
  const reservations = await getMyReservationsService(res.locals.user.id, query)

  return ApiResponse.ok(reservations).send(res)
}

export async function getReservationById(_req, res) {
  const params = res.locals.validated.params
  const reservation = await getMyReservationByIdService(res.locals.user.id, params.id)

  return ApiResponse.ok(reservation).send(res)
}

export async function createReservation(_req, res) {
  const body = res.locals.validated.body
  const reservation = await createReservationService(res.locals.user.id, body)

  return ApiResponse.created(reservation).send(res)
}

export async function cancelMyReservation(_req, res) {
  const params = res.locals.validated.params
  const reservation = await cancelMyReservationService(res.locals.user.id, params.id)

  return ApiResponse.ok(reservation).send(res)
}
