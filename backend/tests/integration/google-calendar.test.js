import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { createSessionToken } from "../../src/config/auth.js";
import { prisma } from "../../src/config/prisma.js";

const {
  buildGoogleAuthorizationUrlMock,
  exchangeGoogleCodeMock,
} = vi.hoisted(() => ({
  buildGoogleAuthorizationUrlMock: vi.fn(
    ({ state }) => `https://accounts.google.com/o/oauth2/v2/auth?state=${state}`,
  ),
  exchangeGoogleCodeMock: vi.fn(async () => ({
    googleUser: {
      googleId: "calendar-google-user-id",
      email: "calendar-user@example.com",
      fullName: "Calendar User",
      avatarUrl: null,
      emailVerified: true,
    },
    tokens: {
      access_token: "access-token",
      refresh_token: "refresh-token",
      expiry_date: Date.UTC(2035, 0, 1, 10, 0, 0),
    },
  })),
}));

vi.mock("../../src/config/google-oauth.js", () => ({
  GOOGLE_CALENDAR_SCOPES: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events",
  ],
  buildGoogleAuthorizationUrl: buildGoogleAuthorizationUrlMock,
  createGoogleOAuthClient: vi.fn(),
  exchangeGoogleCode: exchangeGoogleCodeMock,
  exchangeGoogleCodeForProfile: vi.fn(),
  getGoogleCalendarOAuthRedirectUri: () =>
    "http://localhost:4000/api/v1/google-calendar/connect/callback",
  getGoogleOAuthRedirectUri: () =>
    "http://localhost:4000/api/v1/google-calendar/connect/callback",
  validateFrontendRedirectUrl: (value) => value || "http://localhost:3000/reservations",
  verifyGoogleIdToken: vi.fn(),
}));

vi.mock("../../src/config/google-calendar.js", () => ({
  createGoogleCalendarApiFromRefreshToken: vi.fn(() => ({
    events: {
      delete: vi.fn(),
      insert: vi.fn(),
    },
  })),
  createGoogleCalendarApiFromTokens: vi.fn(),
  decryptGoogleRefreshToken: vi.fn(() => "refresh-token"),
  encryptGoogleRefreshToken: vi.fn((value) => `encrypted:${value}`),
}));

import { app } from "../../src/app.js";

const API = "/api/v1/google-calendar";

let user;
let token;

beforeAll(async () => {
  const userRole = await prisma.role.findUnique({
    where: {
      name: "user",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "calendar-user@example.com",
    },
    update: {
      googleId: "calendar-google-user-id",
      roleId: userRole.id,
    },
    create: {
      googleId: "calendar-google-user-id",
      email: "calendar-user@example.com",
      fullName: "Calendar User",
      avatarUrl: null,
      roleId: userRole.id,
    },
  });

  user = await prisma.user.findUnique({
    where: {
      email: "calendar-user@example.com",
    },
    include: {
      role: true,
    },
  });

  token = createSessionToken(user);

  await prisma.calendarIntegration.deleteMany({
    where: {
      userId: user.id,
    },
  });
});

describe("Google Calendar integration API", () => {
  it("GET /api/v1/google-calendar/status zwraca brak polaczenia", async () => {
    const response = await request(app)
      .get(`${API}/status`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.connected).toBe(false);
  });

  it("GET /api/v1/google-calendar/connect/start przekierowuje do Google OAuth", async () => {
    const response = await request(app)
      .get(`${API}/connect/start`)
      .set("Authorization", `Bearer ${token}`)
      .query({ redirectTo: "http://localhost:3000/reservations" });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("accounts.google.com");
  });

  it("GET /api/v1/google-calendar/connect/callback zapisuje refresh token i wraca na frontend", async () => {
    const startResponse = await request(app)
      .get(`${API}/connect/start`)
      .set("Authorization", `Bearer ${token}`)
      .query({ redirectTo: "http://localhost:3000/reservations" });

    const callbackUrl = new URL(startResponse.headers.location);
    const state = callbackUrl.searchParams.get("state");

    const response = await request(app)
      .get(`${API}/connect/callback`)
      .query({
        code: "calendar-auth-code",
        state,
      });

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("googleCalendar=connected");

    const integration = await prisma.calendarIntegration.findUnique({
      where: {
        userId: user.id,
      },
    });

    expect(integration).not.toBeNull();
    expect(integration?.calendarEmail).toBe("calendar-user@example.com");
    expect(integration?.refreshTokenEncrypted).toBe("encrypted:refresh-token");
  });

  it("GET /api/v1/google-calendar/status zwraca aktywne polaczenie", async () => {
    const response = await request(app)
      .get(`${API}/status`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.connected).toBe(true);
    expect(response.body.data.calendarEmail).toBe("calendar-user@example.com");
  });

  it("DELETE /api/v1/google-calendar/connection usuwa polaczenie", async () => {
    const response = await request(app)
      .delete(`${API}/connection`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.disconnected).toBe(true);

    const integration = await prisma.calendarIntegration.findUnique({
      where: {
        userId: user.id,
      },
    });

    expect(integration).toBeNull();
  });
});
