import request from "supertest";
import { afterAll, describe, expect, it, vi } from "vitest";
import { GoogleOAuthValidationError } from "../../src/config/config.errors.js";

const { verifyGoogleIdTokenMock, buildGoogleAuthorizationUrlMock } = vi.hoisted(() => ({
  verifyGoogleIdTokenMock: vi.fn(async (token) => {
    if (token === "invalid-google-token") {
      throw new GoogleOAuthValidationError("invalid token");
    }

    return {
      googleId: "auth-test-google-user",
      email: "auth-test@example.com",
      fullName: "Auth Test",
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
}));

import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: "auth-test@example.com" },
  });
});

describe("Google OAuth API", () => {
  it("tworzy sesje Google i zwraca zalogowanego uzytkownika", async () => {
    const sessionResponse = await request(app)
      .post("/api/v1/auth/session")
      .set("Authorization", "Bearer valid-google-token");

    const meResponse = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${sessionResponse.body.data.token}`);

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.data.user.email).toBe("auth-test@example.com");
    expect(typeof sessionResponse.body.data.token).toBe("string");
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.googleId).toBe("auth-test-google-user");
  });

  it("POST /api/v1/auth/session odrzuca nieprawidlowy token Google", async () => {
    const response = await request(app)
      .post("/api/v1/auth/session")
      .set("Authorization", "Bearer invalid-google-token");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("GOOGLE_AUTH_FAILED");
  });

  it("zwraca URL autoryzacji Google", async () => {
    const response = await request(app)
      .get("/api/v1/auth/google/url")
      .query({ redirectTo: "http://localhost:3000/login" });

    expect(response.status).toBe(200);
    expect(response.body.data.authorizationUrl).toContain("accounts.google.com");
  });
});
