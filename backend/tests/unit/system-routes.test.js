import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import healthRoutes from "../../src/modules/health/health.routes.js";
import problemsRoutes from "../../src/modules/problems/problems.routes.js";

describe("Endpointy backendu", () => {
  it("udostępnia oba adresy health check", async () => {
    const app = express();
    app.use("/health", healthRoutes);
    app.use("/api/v1/health", healthRoutes);

    for (const url of ["/health", "/api/v1/health"]) {
      expect((await request(app).get(url)).body.data.status).toBe("ok");
    }
  });

  it("udostępnia opis znanego problemu", async () => {
    const app = express();
    app.use("/problems", problemsRoutes);

    const response = await request(app).get("/problems/auth-rate-limited");

    expect(response).toMatchObject({ status: 200 });
    expect(response.text).toContain("AUTH_RATE_LIMITED");
  });
});
