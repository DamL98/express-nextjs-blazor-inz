import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GoogleOAuthConfigurationError,
  GoogleOAuthValidationError,
} from "../../src/config/config.errors.js";
import {
  validateFrontendRedirectUrl,
  validateGoogleOAuthConfiguration,
} from "../../src/config/google-oauth.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Google OAuth configuration", () => {
  it("wymaga id i sekretu klienta", () => {
    vi.stubEnv("GOOGLE_OAUTH_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_OAUTH_CLIENT_SECRET", "");

    expect(() => validateGoogleOAuthConfiguration()).toThrow(
      GoogleOAuthConfigurationError,
    );
  });

  it("akceptuje redirect do skonfigurowanego frontendu", () => {
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
});
