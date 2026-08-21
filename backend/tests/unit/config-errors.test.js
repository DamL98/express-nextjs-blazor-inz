import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GoogleCalendarTokenError,
  GoogleOAuthConfigurationError,
  GoogleOAuthValidationError,
  OAuthStateVerificationError,
} from "../../src/config/config.errors.js";
import { decryptGoogleRefreshToken } from "../../src/security/googleRefreshToken.js";
import { verifyGoogleOAuthState } from "../../src/security/jwt.js";
import {
  validateFrontendRedirectUrl,
  validateGoogleOAuthConfiguration,
} from "../../src/config/google-oauth.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("configuration errors", () => {
  it("rzuca typowany blad dla brakujacej konfiguracji Google OAuth", () => {
    vi.stubEnv("GOOGLE_OAUTH_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_OAUTH_CLIENT_SECRET", "");

    expect(() => validateGoogleOAuthConfiguration()).toThrow(
      GoogleOAuthConfigurationError,
    );
  });

  it("opakowuje blad weryfikacji OAuth state", () => {
    expect(() => verifyGoogleOAuthState("invalid-state")).toThrow(
      OAuthStateVerificationError,
    );
  });

  it("odroznia bledny token kalendarza od bledu konfiguracji", () => {
    expect(() => decryptGoogleRefreshToken("invalid-token")).toThrow(
      GoogleCalendarTokenError,
    );
  });

  it("akceptuje sciezke na dozwolonym frontendzie", () => {
    vi.stubEnv("FRONTEND_NEXT_URL", "http://localhost:3000");
    vi.stubEnv("FRONTEND_BLAZOR_URL", "http://localhost:5173");

    expect(
      validateFrontendRedirectUrl("http://localhost:3000/reservations"),
    ).toBe("http://localhost:3000/reservations");
  });

  it("odrzuca redirect do obcego originu", () => {
    expect(() =>
      validateFrontendRedirectUrl("https://example.com/callback"),
    ).toThrow(GoogleOAuthValidationError);
  });

  it("odroznia bledny redirect od blednej konfiguracji frontendu", () => {
    expect(() => validateFrontendRedirectUrl("not-a-url")).toThrow(
      GoogleOAuthValidationError,
    );

    vi.stubEnv("FRONTEND_NEXT_URL", "not-a-url");

    expect(() =>
      validateFrontendRedirectUrl("http://localhost:3000/login"),
    ).toThrow(GoogleOAuthConfigurationError);
  });
});
