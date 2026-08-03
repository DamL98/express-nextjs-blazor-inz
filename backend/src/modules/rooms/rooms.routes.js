import { Router } from "express";
import { validateMiddleware } from "../../middlewares/validate.middleware.js";

import {
  getRoomAvailabilityController,
  getRoomByIdController,
  getRoomsController,
} from "./rooms.controller.js";

import {
  getRoomsQuerySchema,
  roomAvailabilityQuerySchema,
  roomIdParamsSchema,
} from "./rooms.validation.js";
///////////////////////////////////////////////////////////////////////////////////////


const router = Router();

router.get(
  "/",
  validateMiddleware(getRoomsQuerySchema, "query"),
  getRoomsController,
);

router.get(
  "/:id/availability",
  validateMiddleware(roomIdParamsSchema, "params"),
  validateMiddleware(roomAvailabilityQuerySchema, "query"),
  getRoomAvailabilityController,
);

router.get(
  "/:id",
  validateMiddleware(roomIdParamsSchema, "params"),
  getRoomByIdController,
);

export default router;
