import { Router } from "express";
import { createAuthRateLimiter } from "../../middlewares/rate-limit.middleware.js";
import { validateMiddleware } from "../../middlewares/validate.middleware.js";
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
router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const authRateLimiter = createAuthRateLimiter();

const body = (schema) => validateMiddleware(schema, "body");

router.post("/register", authRateLimiter, body(registerSchema), local.register);
router.post("/login", authRateLimiter, body(loginSchema), local.login);

router.post("/verification/request", authRateLimiter, body(emailSchema), local.requestEmailAction("verify-email"));
router.post("/verify-email", authRateLimiter, body(tokenSchema), local.verifyEmail);

router.post("/password/forgot", authRateLimiter, body(emailSchema), local.requestEmailAction("reset-password"));
router.post("/password/reset", authRateLimiter, body(resetPasswordSchema), local.resetPassword);
router.post("/password/change", authRateLimiter, authenticate, body(changePasswordSchema), local.changePassword);

router.post("/session", createSession);
router.post("/logout", logout);
router.post("/google/link", authRateLimiter, authenticate, body(linkGoogleSchema), startGoogleLink);

router.get("/google/url", getGoogleAuthorizationUrl);
router.get("/google/start", redirectToGoogleAuthorization);
router.get("/google/callback", handleGoogleOAuthCallback);

router.get("/me", authenticate, getCurrentUser);


export default router;
