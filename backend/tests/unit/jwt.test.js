import { afterEach, describe, expect, it, vi } from "vitest";

import {
  OAuthStateVerificationError,
  SessionTokenVerificationError,
} from "../../src/config/config.errors.js";
import {
  createGoogleOAuthState,
  createSessionToken,
  verifyGoogleOAuthState,
  verifySessionToken,
} from "../../src/security/jwt.js";

function configureJwt() {
  vi.stubEnv("JWT_SECRET", "test-jwt-secret");
  vi.stubEnv("AUTH_SESSION_TTL", "1h");
  vi.stubEnv("AUTH_SESSION_TOKEN_AUDIENCE", "test-session");
  vi.stubEnv("AUTH_SESSION_TOKEN_ISSUER", "test-api");
  vi.stubEnv("AUTH_TOKEN_AUDIENCE", "test-oauth-state");
  vi.stubEnv("AUTH_TOKEN_TTL", "5m");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("JWT security", () => {
  it("tworzy i weryfikuje token sesji", () => {
    configureJwt();
    const token = createSessionToken({
      id: "user-1",
      email: "user@example.com",
      role: { name: "user" },
    });

    expect(verifySessionToken(token)).toMatchObject({
      sub: "user-1",
      email: "user@example.com",
      role: "user",
    });
  });

  it("tworzy i weryfikuje OAuth state", () => {
    configureJwt();
    const state = createGoogleOAuthState({ redirectTo: "http://localhost:3000" });

    expect(verifyGoogleOAuthState(state)).toMatchObject({
      redirectTo: "http://localhost:3000",
    });
  });

  it("rozroznia nieprawidlowy token sesji i OAuth state", () => {
    configureJwt();

    expect(() => verifySessionToken("invalid-token")).toThrow(
      SessionTokenVerificationError,
    );
    expect(() => verifyGoogleOAuthState("invalid-state")).toThrow(
      OAuthStateVerificationError,
    );
  });
});
