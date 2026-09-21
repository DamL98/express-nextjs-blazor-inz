import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Nieprawidlowy e-mail").max(254));
const password = z.string().min(15, "Haslo musi miec co najmniej 15 znakow").max(128);

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });

export const registerSchema = loginSchema.extend({
  password,
  fullName: z.string().trim().min(1).max(100),
  redirectTo: z.url(),
});

export const emailSchema = z.object({ email, redirectTo: z.url() });
export const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) });
export const resetPasswordSchema = tokenSchema.extend({ password });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), password });
export const linkGoogleSchema = z.object({ password: z.string().min(1).max(128), redirectTo: z.url() });
