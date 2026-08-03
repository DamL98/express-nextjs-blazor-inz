import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const { verifyGoogleIdTokenMock, buildGoogleAuthorizationUrlMock } = vi.hoisted(() => ({
  verifyGoogleIdTokenMock: vi.fn(async (token) => {
    if (token === "invalid-google-token") {
      throw new Error("invalid token");
    }

    return {
      googleId: "auth-test-google-user",
      email: "user@example.com",
      fullName: "Damian Lll",
      avatarUrl: "https://example.com/avatar.png",
      emailVerified: true,
    };
  }),
  buildGoogleAuthorizationUrlMock: vi.fn(({ state }) => `https://accounts.google.com/o/oauth2/v2/auth?state=${state}`),
}));

vi.mock("../../src/config/google-oauth.js", () => ({
  GOOGLE_CALENDAR_SCOPES: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.events"],
  buildGoogleAuthorizationUrl: buildGoogleAuthorizationUrlMock,
  exchangeGoogleCode: vi.fn(),
  exchangeGoogleCodeForProfile: vi.fn(),
  getGoogleCalendarOAuthRedirectUri: () => "http://localhost:4000/api/v1/google-calendar/connect/callback",
  getGoogleOAuthRedirectUri: () => "http://localhost:4000/api/v1/auth/google/callback",
  validateFrontendRedirectUrl: (value) => value || "http://localhost:3000",
  verifyGoogleIdToken: verifyGoogleIdTokenMock,
  createGoogleOAuthClient: vi.fn(),
}));

vi.mock("../../src/config/google-calendar.js", () => ({
  createGoogleCalendarApiFromRefreshToken: vi.fn(),
  createGoogleCalendarApiFromTokens: vi.fn(),
  decryptGoogleRefreshToken: vi.fn(),
  encryptGoogleRefreshToken: vi.fn(),
}));

import { app } from "../../src/app.js";

describe("Google OAuth API", () => {
  it("GET /api/v1/auth/me wymaga tokenu sesji backendu", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("POST /api/v1/auth/session synchronizuje konto Google i zwraca sesje backendu", async () => {
    const response = await request(app)
      .post("/api/v1/auth/session")
      .set("Authorization", "Bearer valid-google-token");

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe("user@example.com");
    expect(response.body.data.user.googleId).toBe("auth-test-google-user");
    expect(response.body.data.user.role.name).toBe("user");
    expect(typeof response.body.data.token).toBe("string");
  });

  it("GET /api/v1/auth/me akceptuje token sesji backendu", async () => {
    const sessionResponse = await request(app)
      .post("/api/v1/auth/session")
      .set("Authorization", "Bearer valid-google-token");

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${sessionResponse.body.data.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe("user@example.com");
    expect(response.body.data.googleId).toBe("auth-test-google-user");
  });

  it("POST /api/v1/auth/session odrzuca nieprawidlowy token Google", async () => {
    const response = await request(app)
      .post("/api/v1/auth/session")
      .set("Authorization", "Bearer invalid-google-token");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("GOOGLE_AUTH_FAILED");
  });

  it("GET /api/v1/auth/google/url zwraca URL autoryzacji Google", async () => {
    const response = await request(app)
      .get("/api/v1/auth/google/url")
      .query({ redirectTo: "http://localhost:3000/login" });

    expect(response.status).toBe(200);
    expect(response.body.data.authorizationUrl).toContain("accounts.google.com");
  });
});
