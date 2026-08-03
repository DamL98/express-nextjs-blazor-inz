import { Router } from "express"

import { validateMiddleware } from "../../middlewares/validate.middleware.js"
import { authenticate } from "../../middlewares/auth.middleware.js"

import {
  cancelMyReservation,
  createReservation,
  getMyReservations,
  getReservationById,
} from "./reservations.controller.js"

import {
  createReservationBodySchema,
  getReservationsQuerySchema,
  reservationIdParamsSchema,
} from "./reservations.validation.js"

export const reservationsRoutes = Router()

reservationsRoutes.use(authenticate)

reservationsRoutes.get(
  "/my",
  validateMiddleware(getReservationsQuerySchema, "query"),
  getMyReservations
)

reservationsRoutes.get(
  "/:id",
  validateMiddleware(reservationIdParamsSchema, "params"),
  getReservationById
)

reservationsRoutes.post(
  "/",
  validateMiddleware(createReservationBodySchema, "body"),
  createReservation
)

reservationsRoutes.patch(
  "/:id/cancel",
  validateMiddleware(reservationIdParamsSchema, "params"),
  cancelMyReservation
)

export default reservationsRoutes
