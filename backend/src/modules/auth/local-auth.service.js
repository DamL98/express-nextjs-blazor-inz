import { randomBytes } from "node:crypto";
import { userRepository } from "../../repositories/user.repository.js";
import { authTokenRepository } from "../../repositories/auth-token.repository.js";
import { hashPassword, verifyPassword } from "../../security/password.js";
import { sendAuthMail } from "../../config/mail.js";
import { validateFrontendRedirectUrl } from "../../config/google-oauth.js";
import { ApiError } from "../../errors/apiError.js";
import { Problems } from "../../errors/problems.js";
import { createUserSession } from "./auth.service.js";

export async function registerLocal(data) {
  validateFrontendRedirectUrl(data.redirectTo);
  const passwordHash = await hashPassword(data.password);

  try {
    await userRepository.createLocal({ ...data, passwordHash });
    return true;
  } catch (error) {
    // Odpowiedź nie ujawnia, czy adres ma już konto
    if (error.code !== "P2002") throw error;

    return false;
  }
}

export async function checkLocalPassword(email, password) {
  const user = await userRepository.findCredentials(email);

  if (!await verifyPassword(user?.passwordHash, password)) {
    throw new ApiError(Problems.AUTH_CREDENTIALS_INVALID);
  }

  return user;
}

export async function loginLocal({ email, password }) {
  const user = await checkLocalPassword(email, password);
  if (!user.emailVerified) throw new ApiError(Problems.AUTH_EMAIL_UNVERIFIED);
  return createUserSession(await userRepository.touchLogin(user.id));
}

export async function requestEmailAction({ email, redirectTo }, purpose) {
  const url = new URL(validateFrontendRedirectUrl(redirectTo));
  const user = await userRepository.findCredentials(email);

  if (!user?.passwordHash || (purpose === "verify-email" && user.emailVerified)) return;

  const token = randomBytes(32).toString("hex");

  await authTokenRepository.create(token, purpose, user.id, new Date(Date.now() + 30 * 60 * 1000));
  url.hash = new URLSearchParams({ action: purpose, token }).toString();

  await sendAuthMail(email, purpose === "verify-email" ? "Potwierdz adres e-mail" : "Zresetuj haslo",
    `Otworz link w ciagu 30 minut: ${url}\nJesli nie prosiles o te operacje, zignoruj wiadomosc.`);
}

export async function verifyEmail(token) {
  await authTokenRepository.consume(token, "verify-email", async (tx, record) => {
    await tx.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    await tx.authToken.deleteMany({ where: { userId: record.userId, purpose: "verify-email" } });
  });
}

export async function resetPassword({ token, password }) {
  const passwordHash = await hashPassword(password);
  await authTokenRepository.consume(token, "reset-password", async (tx, record) => {
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash, emailVerified: true, sessionVersion: { increment: 1 } } });
    await tx.authToken.deleteMany({ where: { userId: record.userId } });
  });
}

export async function changePassword(user, { currentPassword, password }) {
  const credentials = await checkLocalPassword(user.email, currentPassword);
  await userRepository.changePassword(user.id, credentials.passwordHash, await hashPassword(password));

  return createUserSession(await userRepository.findPublicUserById(user.id));
}
