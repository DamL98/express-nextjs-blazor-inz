import { Router } from "express";

import { getMeasurementInfo } from "./measurement.controller.js";

const router = Router();

router.get("/", getMeasurementInfo);

export default router;
