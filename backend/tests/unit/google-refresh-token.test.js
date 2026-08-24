import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GoogleCalendarConfigurationError,
  GoogleCalendarTokenError,
} from "../../src/config/config.errors.js";
import {
  decryptGoogleRefreshToken,
  encryptGoogleRefreshToken,
  validateGoogleRefreshTokenConfiguration,
} from "../../src/security/googleRefreshToken.js";

function configureEncryption() {
  vi.stubEnv(
    "GOOGLE_TOKEN_ENCRYPTION_KEY",
    Buffer.alloc(32, "a").toString("base64"),
  );
  vi.stubEnv("GOOGLE_TOKEN_ENCRYPTION_ALGORITHM", "aes-256-gcm");
  vi.stubEnv("GOOGLE_TOKEN_ENCRYPTION_IV_LENGTH", "12");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Google refresh token encryption", () => {
  it("szyfruje i odszyfrowuje refresh token", () => {
    configureEncryption();
    const encrypted = encryptGoogleRefreshToken("refresh-token");

    expect(encrypted).not.toBe("refresh-token");
    expect(decryptGoogleRefreshToken(encrypted)).toBe("refresh-token");
  });

  it("odrzuca nieprawidlowy format tokenu", () => {
    expect(() => decryptGoogleRefreshToken("invalid-token")).toThrow(
      GoogleCalendarTokenError,
    );
  });

  it("odrzuca nieprawidlowa konfiguracje klucza", () => {
    vi.stubEnv("GOOGLE_TOKEN_ENCRYPTION_KEY", "invalid-key");

    expect(() => validateGoogleRefreshTokenConfiguration()).toThrow(
      GoogleCalendarConfigurationError,
    );
  });
});
