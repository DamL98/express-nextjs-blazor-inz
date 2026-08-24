import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../src/app.js";

describe("API Problem Details contract", () => {
  it("udostepnia opis typu problemu", async () => {
    const response = await request(app).get("/problems/room-not-found");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^text\/html/);
    expect(response.text).toContain("ROOM_NOT_FOUND");
  });

  it("zwraca Problem Details dla nieznanego endpointu", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(
      /^application\/problem\+json/,
    );
    expect(response.body).toMatchObject({
      type: "/problems/route-not-found",
      status: 404,
      code: "ROUTE_NOT_FOUND",
    });
    expect(response.body.instance).toMatch(/^urn:uuid:/);
  });

  it("dolacza szczegoly bledu walidacji", async () => {
    const response = await request(app).get("/api/v1/rooms?capacityMin=abc");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.errors.properties.capacityMin.errors).toBeDefined();
  });
});
