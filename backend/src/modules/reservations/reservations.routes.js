import { Router } from "express"

import { validate } from "../../middlewares/validate.middleware.js"

import {
  cancelMyReservation,
  cancelReservation,
  createReservation,
  getAllReservations,
  getMyReservations,
  getReservationById,
} from "./reservations.controller.js"

import {
  createReservationBodySchema,
  getReservationsQuerySchema,
  reservationIdParamsSchema,
} from "./reservations.validation.js"

export const reservationsRoutes = Router()
export const adminReservationsRoutes = Router()

reservationsRoutes.get(
  "/my",
  validate(getReservationsQuerySchema, "query"),
  getMyReservations
)

reservationsRoutes.get(
  "/:id",
  validate(reservationIdParamsSchema, "params"),
  getReservationById
)

reservationsRoutes.post(
  "/",
  validate(createReservationBodySchema, "body"),
  createReservation
)

reservationsRoutes.patch(
  "/:id/cancel",
  validate(reservationIdParamsSchema, "params"),
  cancelMyReservation
)

export default reservationsRoutes
