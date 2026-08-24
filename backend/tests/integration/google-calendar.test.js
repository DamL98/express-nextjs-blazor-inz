import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../src/config/prisma.js";
import { authorize, getUserSession } from "../support/integration.js";

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
}));

vi.mock("../../src/security/googleRefreshToken.js", () => ({
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

  ({ user, token } = await getUserSession("calendar-user@example.com"));
});

beforeEach(async () => {
  await prisma.calendarIntegration.deleteMany({
    where: {
      userId: user.id,
    },
  });
});

afterAll(async () => {
  await prisma.calendarIntegration.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { email: "calendar-user@example.com" } });
});

describe("Google Calendar integration API", () => {
  it("wymaga zalogowania", async () => {
    const response = await request(app).get(`${API}/status`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  it("obsluguje caly cykl polaczenia z kalendarzem", async () => {
    const initialStatus = await authorize(request(app).get(`${API}/status`), token);

    expect(initialStatus.status).toBe(200);
    expect(initialStatus.body.data.connected).toBe(false);

    const startResponse = await authorize(
      request(app)
        .get(`${API}/connect/start`)
        .query({ redirectTo: "http://localhost:3000/reservations" }),
      token,
    );
    const callbackUrl = new URL(startResponse.headers.location);
    const state = callbackUrl.searchParams.get("state");

    const callbackResponse = await request(app)
      .get(`${API}/connect/callback`)
      .query({ code: "calendar-auth-code", state });

    const connectedStatus = await authorize(
      request(app).get(`${API}/status`),
      token,
    );
    const disconnectResponse = await authorize(
      request(app).delete(`${API}/connection`),
      token,
    );

    expect(startResponse.status).toBe(302);
    expect(startResponse.headers.location).toContain("accounts.google.com");
    expect(callbackResponse.status).toBe(302);
    expect(callbackResponse.headers.location).toContain("googleCalendar=connected");
    expect(connectedStatus.body.data).toMatchObject({
      connected: true,
      calendarEmail: "calendar-user@example.com",
    });
    expect(disconnectResponse.status).toBe(200);
    expect(disconnectResponse.body.data.disconnected).toBe(true);

    const integration = await prisma.calendarIntegration.findUnique({
      where: { userId: user.id },
    });

    expect(integration).toBeNull();
  });

  it("odrzuca nieprawidlowy OAuth state", async () => {
    const response = await request(app)
      .get(`${API}/connect/callback`)
      .query({ code: "test-code", state: "invalid-state" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("GOOGLE_CALENDAR_STATE_INVALID");
  });
});
