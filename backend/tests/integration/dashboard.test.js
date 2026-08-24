import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { authorize, getUserSession } from "../support/integration.js";

let token;

beforeAll(async () => {
  ({ token } = await getUserSession("user@example.com"));
});

describe("Dashboard API", () => {
  it("zwraca gotowy model dashboardu", async () => {
    const response = await authorize(
      request(app).get("/api/v1/dashboard"),
      token,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.activeRoomsCount).toBeTypeOf("number");
    expect(response.body.data.nextReservations.length).toBeLessThanOrEqual(3);
  });
});
