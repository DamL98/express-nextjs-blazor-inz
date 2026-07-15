import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
// klient do google calendar api
import { google } from "googleapis";
// config oauth
import { createGoogleOAuthClient } from "./google-oauth.js";

// *****************************************************************
// szyfrowanie i odszyfrowanie refresh_token
//
// tworzenie Klienta Google Calendar API - wymiana danych z kalendarzem Usera
//

// aes-256 - klucz 256 bitowy
// gcm - integralnosc
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

// dlugosc random wektora inicjalizujacego (gcm -> 12 bajtow defaultowo)
const IV_LENGTH = 12;

// stala nazwa dla erroru configa
const GOOGLE_CALENDAR_CONFIG_ERROR = "GoogleCalendarConfigError";

// FUNKCJE POMOCNICZE
// tworzenie i rozpoznawanie errorow
// odseparowane od apiError
function createNamedError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

export function createGoogleCalendarConfigError(message) {
  return createNamedError(GOOGLE_CALENDAR_CONFIG_ERROR, message);
}

export function isGoogleCalendarConfigError(error) {
  return error instanceof Error && error.name === GOOGLE_CALENDAR_CONFIG_ERROR;
}





function getEncryptionKey() {
  const rawKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();

  if (!rawKey) {
    throw createGoogleCalendarConfigError(
      "Brak GOOGLE_TOKEN_ENCRYPTION_KEY w configu backendu",
    );
  }

  let key;

  try {
    key = Buffer.from(rawKey, "base64");
  } catch {
    throw createGoogleCalendarConfigError(
      "GOOGLE_TOKEN_ENCRYPTION_KEY musi byc poprawnym kluczem base64",
    );
  }

  if (key.length !== 32) {
    throw createGoogleCalendarConfigError(
      "GOOGLE_TOKEN_ENCRYPTION_KEY po dekodowaniu musi miec 32 bajty",
    );
  }

  return key;
}

// refresh_token
export function encryptGoogleRefreshToken(refreshToken) {
  // refresh_token Google trzymany tylko po stronie backendu i zapisany zaszyfrowany
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
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

// refresh_token
export function decryptGoogleRefreshToken(payload) {
  const parts = payload.split(".");

  if (parts.length !== 3) {
    throw createGoogleCalendarConfigError(
      "Nieprawidlowy format zaszyfrowanego refresh tokena",
    );
  }

  const [ivValue, authTagValue, encryptedValue] = parts;
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
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
