import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("API error responses", () => {
  it("zwraca ustrukturyzowany blad dla nieznanego endpointu", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.res.statusMessage).toBe("Not Found");
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Endpoint GET /api/v1/unknown nie istnieje",
        details: null,
      },
    });
  });

  it("zwraca dotychczasowy envelope bledu walidacji", async () => {
    const response = await request(app).get("/api/v1/rooms?capacityMin=abc");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toBe("Błędne dane wejściowe");
    expect(response.body.error.details.fieldErrors.capacityMin).toBeDefined();
  });

  it("zwraca dotychczasowy blad dla chronionego endpointu bez sesji", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "AUTH_TOKEN_REQUIRED",
        message: "Wymagane zalogowanie # brak auth tokenu",
        details: null,
      },
    });
  });

  it("zwraca kontrolowany blad dla nieprawidlowego Google Calendar state", async () => {
    const response = await request(app)
      .get("/api/v1/google-calendar/connect/callback")
      .query({ code: "test-code", state: "invalid-state" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("GOOGLE_CALENDAR_STATE_INVALID");
  });
});
