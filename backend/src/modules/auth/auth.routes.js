import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { getCurrentUser } from "./auth.controller.js";

const router = Router();

router.get("/me", authenticate, getCurrentUser);
router.post("/session", authenticate, getCurrentUser);

export default router;
