import nodemailer from "nodemailer";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { getApplicationEnvironment } from "./environment.js";
import { ApiError } from "../errors/apiError.js";
import { Problems } from "../errors/problems.js";

export async function sendAuthMail(to, subject, text) {
  try {
    const smtpUrl = process.env.SMTP_URL;
    if (!smtpUrl && getApplicationEnvironment().isProduction) {
      throw new Error("Brak konfiguracji SMTP");
    }
    const transport = nodemailer.createTransport(smtpUrl || { jsonTransport: true });
    const result = await transport.sendMail({ from: process.env.MAIL_FROM || "rezerwacje@localhost", to, subject, text });
    if (!smtpUrl) {
      // Lokalna skrzynka pozwala sprawdzić linki bez wysyłania prawdziwych wiadomości.
      const directory = new URL("../../.local-mail/", import.meta.url);
      await mkdir(directory, { recursive: true });
      await writeFile(new URL(`${randomUUID()}.json`, directory), result.message, { mode: 0o600 });
    }
  } catch {
    throw new ApiError(Problems.AUTH_MAIL_UNAVAILABLE);
  }
}
