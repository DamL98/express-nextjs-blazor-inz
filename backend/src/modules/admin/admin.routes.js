import { Router } from "express"

import { validate } from "../../middlewares/validate.middleware.js"
import { authenticate, requireRole } from "../../middlewares/auth.middleware.js"
import {
  cancelAdminReservation,
  getAdminReservations,
} from "./admin.controller.js"
import {
  adminReservationIdParamsSchema,
  getAdminReservationsQuerySchema,
} from "./admin.validation.js"

const router = Router()

router.use(authenticate, requireRole("admin"))

router.get(
  "/reservations",
  validate(getAdminReservationsQuerySchema, "query"),
  getAdminReservations
)

router.patch(
  "/reservations/:id/cancel",
  validate(adminReservationIdParamsSchema, "params"),
  cancelAdminReservation
)

export default router
