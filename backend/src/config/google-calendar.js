import {
  createCipheriv,
  createDecipheriv,
  getCiphers,
  randomBytes,
} from "node:crypto";
// klient do google calendar api
import { google } from "googleapis";
// config oauth
import { createGoogleOAuthClient } from "./google-oauth.js";
import {
  GoogleCalendarConfigurationError,
  GoogleCalendarTokenError,
} from "./config.errors.js";

// *****************************************************************
// szyfrowanie i odszyfrowanie refresh_token
//
// tworzenie Klienta Google Calendar API - wymiana danych z kalendarzem Usera
//

export function getGoogleTokenEncryptionKey() {
  return process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();
}

export function getGoogleTokenEncryptionAlgorithm() {
  return process.env.GOOGLE_TOKEN_ENCRYPTION_ALGORITHM?.trim() || "aes-256-gcm";
}

export function getGoogleTokenEncryptionIvLength() {
  return Number(process.env.GOOGLE_TOKEN_ENCRYPTION_IV_LENGTH?.trim() || 12);
}

function getEncryptionKey() {
  const key = Buffer.from(getGoogleTokenEncryptionKey() || "", "base64");

  if (key.length !== 32) {
    throw new GoogleCalendarConfigurationError(
      "Blad GOOGLE_TOKEN_ENCRYPTION_KEY w config env",
    );
  }

  return key;
}

export function validateGoogleCalendarConfiguration() {
  getEncryptionKey();

  const algorithm = getGoogleTokenEncryptionAlgorithm();
  if (!getCiphers().includes(algorithm)) {
    throw new GoogleCalendarConfigurationError(
      `Nieobslugiwany algorytm szyfrowania: ${algorithm}`,
    );
  }

  const ivLength = getGoogleTokenEncryptionIvLength();
  if (!Number.isInteger(ivLength) || ivLength <= 0) {
    throw new GoogleCalendarConfigurationError(
      "GOOGLE_TOKEN_ENCRYPTION_IV_LENGTH_ERR",
    );
  }
}

// refresh_token
export function encryptGoogleRefreshToken(refreshToken) {
  // refresh_token Google trzymany tylko po stronie backendu i zapisany zaszyfrowany
  const iv = randomBytes(getGoogleTokenEncryptionIvLength());
  const cipher = createCipheriv(getGoogleTokenEncryptionAlgorithm(), getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // https://base64.guru/standards/base64url
  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

// refresh_token
export function decryptGoogleRefreshToken(payload) {
  if (typeof payload !== "string") {
    throw new GoogleCalendarTokenError(
      "Nieprawidlowy format zaszyfrowanego refresh tokena",
    );
  }

  const parts = payload.split(".");

  if (parts.length !== 3) {
    throw new GoogleCalendarTokenError(
      "Nieprawidlowy format zaszyfrowanego refresh tokena",
    );
  }

  try {
    const [ivValue, authTagValue, encryptedValue] = parts;
    const decipher = createDecipheriv(
      getGoogleTokenEncryptionAlgorithm(),
      getEncryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );

    decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    if (error instanceof GoogleCalendarConfigurationError) {
      throw error;
    }

    throw new GoogleCalendarTokenError(
      "Nie mozna odszyfrowac refresh tokena Google Calendar",
      { cause: error },
    );
  }
}

// tworzy klienta google calendar API tylko na podstawie zapisanego refresh_token
export function createGoogleCalendarApiFromTokens(
  tokens,
  redirectUri,
) {
  const client = createGoogleOAuthClient(redirectUri);
  client.setCredentials(tokens);

  return google.calendar({
    version: "v3",
    auth: client,
  });
}

export function createGoogleCalendarApiFromRefreshToken(refreshToken) {
  // przy pozniejszej synchro rezerwacji backend odtwarza klienta Google z jego zapisanego refresh tokena
  const client = createGoogleOAuthClient();
  client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({
    version: "v3",
    auth: client,
  });
}
