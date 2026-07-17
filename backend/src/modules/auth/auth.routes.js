import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  createSession,
  getCurrentUser,
  getGoogleAuthorizationUrl,
  handleGoogleOAuthCallback,
  logout,
  redirectToGoogleAuthorization,
} from "./auth.controller.js";

const router = Router();

router.get("/google/url", getGoogleAuthorizationUrl);
router.get("/google/start", redirectToGoogleAuthorization);
router.get("/google/callback", handleGoogleOAuthCallback);
router.post("/session", createSession);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", logout);

export default router;
