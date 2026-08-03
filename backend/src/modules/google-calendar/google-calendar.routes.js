import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateMiddleware } from "../../middlewares/validate.middleware.js";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  handleGoogleCalendarCallback,
  startGoogleCalendarConnection,
} from "./google-calendar.controller.js";
import { googleCalendarConnectQuerySchema } from "./google-calendar.validation.js";

const router = Router();

router.get("/connect/callback", handleGoogleCalendarCallback);

router.use(authenticate);

router.get("/status", getGoogleCalendarStatus);
router.get(
  "/connect/start",
  validateMiddleware(googleCalendarConnectQuerySchema, "query"),
  startGoogleCalendarConnection,
);
router.delete("/connection", disconnectGoogleCalendar);

export default router;
