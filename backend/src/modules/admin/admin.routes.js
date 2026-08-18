import { Router } from "express"

import { validateMiddleware } from "../../middlewares/validate.middleware.js"
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
  validateMiddleware(getAdminReservationsQuerySchema, "query"),
  getAdminReservations
)

router.patch(
  "/reservations/:id/cancel",
  validateMiddleware(adminReservationIdParamsSchema, "params"),
  cancelAdminReservation
)

export default router
