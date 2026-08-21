import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("API error responses", () => {
  it("udostepnia dokumentacje type URI problemu", async () => {
    const response = await request(app).get("/problems/room-not-found");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^text\/html/);
    expect(response.text).toContain("ROOM_NOT_FOUND");
    expect(response.text).toContain("HTTP status</dt><dd>404");
  });

  it("zwraca ustrukturyzowany blad dla nieznanego endpointu", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/^application\/problem\+json/);
    expect(response.body).toMatchObject({
      type: "/problems/route-not-found",
      title: "Nie znaleziono endpointu",
      status: 404,
      detail: "Endpoint GET /api/v1/unknown nie istnieje",
      code: "ROUTE_NOT_FOUND",
    });
    expect(response.body.instance).toMatch(/^urn:uuid:/);
  });

  it("zwraca Problem Details z rozszerzeniem errors dla walidacji", async () => {
    const response = await request(app).get("/api/v1/rooms?capacityMin=abc");

    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toMatch(/^application\/problem\+json/);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.status).toBe(400);
    expect(response.body.errors.properties.capacityMin.errors).toBeDefined();
  });

  it("zwraca Problem Details dla chronionego endpointu bez sesji", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      type: "/problems/auth-token-required",
      title: "Wymagane zalogowanie",
      status: 401,
      detail: "Brak tokenu sesji",
      code: "AUTH_TOKEN_REQUIRED",
    });
  });

  it("zwraca kontrolowany blad dla nieprawidlowego Google Calendar state", async () => {
    const response = await request(app)
      .get("/api/v1/google-calendar/connect/callback")
      .query({ code: "test-code", state: "invalid-state" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("GOOGLE_CALENDAR_STATE_INVALID");
  });
});
