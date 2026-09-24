import { z } from "../../config/zod.js";

const email = z.string().trim().toLowerCase().pipe(z.email("Nieprawidlowy e-mail").min(3).max(254));
const password = z.string().min(12, "Haslo musi miec co najmniej 12 znakow").max(128);

export const loginSchema = z.object({ email, password });

export const registerSchema = loginSchema.extend({
  password,
  fullName: z.string().trim().min(3).max(32),
  redirectTo: z.url(),
});

export const emailSchema = z.object({ email, redirectTo: z.url() });
export const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) });
export const resetPasswordSchema = tokenSchema.extend({ password });
export const changePasswordSchema = z.object({ currentPassword: password, password });
export const linkGoogleSchema = z.object({ password, redirectTo: z.url() });

export const googleSessionSchema = z.object({
  idToken: z.string().trim().min(1).max(16384).optional(),
  authorizationCode: z.string().trim().min(1).max(4096).optional(),
  redirectUri: z.url().max(2048).optional(),
}).default({});
