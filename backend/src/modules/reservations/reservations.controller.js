import { successResponse } from "../../utils/api-response.js"
import { reservationsService } from "./reservations.service.js"

export async function getMyReservations(_req, res) {
  const query = res.locals.validated.query
  const reservations = await reservationsService.getMyReservations(query)

  return res.status(200).json(successResponse(reservations))
}

export async function getAllReservations(_req, res) {
  const query = res.locals.validated.query
  const reservations = await reservationsService.getAllReservations(query)

  return res.status(200).json(successResponse(reservations))
}

export async function getReservationById(_req, res) {
  const params = res.locals.validated.params
  const reservation = await reservationsService.getMyReservationById(params.id)

  return res.status(200).json(successResponse(reservation))
}

export async function createReservation(_req, res) {
  const body = res.locals.validated.body
  const reservation = await reservationsService.createReservation(body)

  return res.status(201).json(successResponse(reservation))
}

export async function cancelMyReservation(_req, res) {
  const params = res.locals.validated.params
  const reservation = await reservationsService.cancelMyReservation(params.id)

  return res.status(200).json(successResponse(reservation))
}

export async function cancelReservation(_req, res) {
  const params = res.locals.validated.params
  const reservation = await reservationsService.cancelReservation(params.id)

  return res.status(200).json(successResponse(reservation))
}