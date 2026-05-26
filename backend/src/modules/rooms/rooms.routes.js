import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";

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
  validate(getRoomsQuerySchema, "query"),
  getRoomsController,
);

router.get(
  "/:id/availability",
  validate(roomIdParamsSchema, "params"),
  validate(roomAvailabilityQuerySchema, "query"),
  getRoomAvailabilityController,
);

router.get(
  "/:id",
  validate(roomIdParamsSchema, "params"),
  getRoomByIdController,
);

export default router;