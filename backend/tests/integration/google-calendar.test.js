import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const buildGoogleAuthorizationUrl = vi.fn(({ state }) =>
  `https://accounts.google.com/o/oauth2/v2/auth?state=${state}`,
);

vi.mock("../../src/config/google-oauth.js", () => ({
  GOOGLE_CALENDAR_SCOPES: ["openid", "email", "profile"],
  buildGoogleAuthorizationUrl,
  createGoogleOAuthClient: vi.fn(),
  exchangeGoogleCode: vi.fn(),
  exchangeGoogleCodeForProfile: vi.fn(),
  getGoogleCalendarOAuthRedirectUri: () => "http://localhost:4000/api/v1/google-calendar/connect/callback",
  getGoogleOAuthRedirectUri: () => "http://localhost:4000/api/v1/auth/google/callback",
  validateFrontendRedirectUrl: (value) => value || "http://localhost:3000/reservations",
  verifyGoogleIdToken: vi.fn(),
}));

import { app } from "../../src/app.js";

describe("Google Calendar integration API", () => {
  it("wymaga sesji dla statusu integracji", async () => {
    const response = await request(app).get("/api/v1/google-calendar/status");

    expect(response).toMatchObject({ status: 401, body: { code: "AUTH_TOKEN_REQUIRED" } });
  });

  it("odrzuca callback bez poprawnego stanu OAuth", async () => {
    const response = await request(app)
      .get("/api/v1/google-calendar/connect/callback")
      .query({ code: "test-code", state: "invalid-state" });

    expect(response).toMatchObject({ status: 400, body: { code: "GOOGLE_CALENDAR_STATE_INVALID" } });
  });
});
