import {
  createCipheriv,
  createDecipheriv,
  getCiphers,
  randomBytes,
} from "node:crypto";

import {
  GoogleCalendarConfigurationError,
  GoogleCalendarTokenError,
} from "../config/config.errors.js";
import { getGoogleCalendarEnvironment } from "../config/environment.js";

function getEncryptionKey() {
  const key = Buffer.from(
    getGoogleCalendarEnvironment().encryptionKey || "",
    "base64",
  );

  if (key.length !== 32) {
    throw new GoogleCalendarConfigurationError(
      "Blad GOOGLE_TOKEN_ENCRYPTION_KEY w config env",
    );
  }

  return key;
}

export function validateGoogleRefreshTokenConfiguration() {
  const config = getGoogleCalendarEnvironment();
  getEncryptionKey();

  if (!getCiphers().includes(config.encryptionAlgorithm)) {
    throw new GoogleCalendarConfigurationError(
      `Nieobslugiwany algorytm szyfrowania: ${config.encryptionAlgorithm}`,
    );
  }

  if (
    !Number.isInteger(config.encryptionIvLength) ||
    config.encryptionIvLength <= 0
  ) {
    throw new GoogleCalendarConfigurationError(
      "GOOGLE_TOKEN_ENCRYPTION_IV_LENGTH_ERR",
    );
  }
}

export function encryptGoogleRefreshToken(refreshToken) {
  const config = getGoogleCalendarEnvironment();
  const iv = randomBytes(config.encryptionIvLength);
  const cipher = createCipheriv(
    config.encryptionAlgorithm,
    getEncryptionKey(),
    iv,
  );
  const encrypted = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptGoogleRefreshToken(payload) {
  if (typeof payload !== "string" || payload.split(".").length !== 3) {
    throw new GoogleCalendarTokenError(
      "Nieprawidlowy format zaszyfrowanego refresh tokena",
    );
  }

  const [ivValue, authTagValue, encryptedValue] = payload.split(".");
  const encryptionKey = getEncryptionKey();
  const { encryptionAlgorithm } = getGoogleCalendarEnvironment();

  try {
    const decipher = createDecipheriv(
      encryptionAlgorithm,
      encryptionKey,
      Buffer.from(ivValue, "base64url"),
    );

    decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    throw new GoogleCalendarTokenError(
      "Nie mozna odszyfrowac refresh tokena Google Calendar",
      { cause: error },
    );
  }
}
