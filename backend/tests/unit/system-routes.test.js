import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import healthRoutes from "../../src/modules/health/health.routes.js";
import problemsRoutes from "../../src/modules/problems/problems.routes.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Trasy techniczne backendu", () => {
  it("zachowuje oba adresy health check", async () => {
    const app = express();
    app.use("/health", healthRoutes);
    app.use("/api/v1/health", healthRoutes);
    for (const healthUrl of ["/health", "/api/v1/health"]) {
      const response = await request(app).get(healthUrl).expect(200);
      expect(response.body.data.status).toBe("ok");
      expect(response.body.data.service).toBe("reservation-system-api");
    }
  });

  it("udostępnia dokumentację problemu i pomija nieznany kod", async () => {
    const app = express();
    app.use("/problems", problemsRoutes);
    const response = await request(app).get("/problems/auth-rate-limited").expect(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("AUTH_RATE_LIMITED");
    await request(app).get("/problems/unknown").expect(404);
  });

  it.each([false, true])("udostępnia metadane tylko w trybie pomiarowym: %s", async (isMeasurementModeEnabled) => {
    vi.stubEnv("MEASUREMENT_DATABASE_ONLY", String(isMeasurementModeEnabled));
    vi.stubEnv("RATE_LIMIT_ENABLED", "true");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5434/inz_measurements");
    vi.stubEnv("NODE_ENV", "production");
    const { default: measurementRoutes } = await import("../../src/modules/measurement/measurement.routes.js");
    const app = express();
    app.use("/measurement-info", measurementRoutes);
    const response = await request(app).get("/measurement-info");
    expect(response.status).toBe(isMeasurementModeEnabled ? 200 : 404);
    if (isMeasurementModeEnabled) {
      expect(response.body).toEqual({ production: true, isolated: true, rateLimitEnabled: true });
    }
  });
});
