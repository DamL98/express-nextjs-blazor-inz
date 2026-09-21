import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { validateMiddleware } from "../../middlewares/validate.middleware.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";
import * as local from "./local-auth.controller.js";
import { registerSchema, loginSchema, emailSchema, tokenSchema, resetPasswordSchema, changePasswordSchema, linkGoogleSchema } from "./auth.validation.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  createSession,
  getCurrentUser,
  getGoogleAuthorizationUrl,
  handleGoogleOAuthCallback,
  logout,
  redirectToGoogleAuthorization,
  startGoogleLink,
} from "./auth.controller.js";

const router = Router();
router.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
const limit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false,
  handler: (_req, _res, next) => next(new ApiError(Problems.AUTH_RATE_LIMITED)),
});
const body = (schema) => validateMiddleware(schema, "body");

router.post("/register", limit, body(registerSchema), local.register);
router.post("/login", limit, body(loginSchema), local.login);
router.post("/verification/request", limit, body(emailSchema), local.requestEmailAction("verify-email"));
router.post("/verify-email", limit, body(tokenSchema), local.verifyEmail);
router.post("/password/forgot", limit, body(emailSchema), local.requestEmailAction("reset-password"));
router.post("/password/reset", limit, body(resetPasswordSchema), local.resetPassword);
router.post("/password/change", limit, authenticate, body(changePasswordSchema), local.changePassword);
router.post("/google/link", limit, authenticate, body(linkGoogleSchema), startGoogleLink);

router.get("/google/url", getGoogleAuthorizationUrl);
router.get("/google/start", redirectToGoogleAuthorization);
router.get("/google/callback", handleGoogleOAuthCallback);
router.post("/session", createSession);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", logout);

export default router;
