import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getStartupEnvironment } from "../../src/config/startup-environment.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Profile uruchamiania aplikacji", () => {
  it.each(["production", "measurements"])("ustawia profil %s przed uruchomieniem Express", async (profile) => {
    const configured = getStartupEnvironment(profile, {});
    for (const [key, value] of Object.entries(configured)) vi.stubEnv(key, value);

    if (profile === "production") {
      vi.stubEnv("FRONTEND_NEXT_URL", "http://localhost:3000");
      vi.stubEnv("FRONTEND_BLAZOR_URL", "http://localhost:5173");
    }

    vi.doMock("../../src/config/prisma.js", () => ({ prisma: {} }));
    const { app } = await import("../../src/app.js");
    const measurements = profile === "measurements";

    const response = await request(app).get("/measurement-info").expect(measurements ? 200 : 404);
    if (measurements) {
      expect(response.body).toEqual({ production: true, isolated: true, rateLimitEnabled: false });
    }

    for (const origin of measurements
      ? ["http://localhost:3100", "http://localhost:5177"]
      : ["http://localhost:3000", "http://localhost:5173"]) {
      const cors = await request(app).options("/api/v1/rooms")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", "GET")
        .expect(204);

      expect(cors.headers["access-control-allow-origin"]).toBe(origin);
      expect(cors.headers["access-control-allow-credentials"]).toBe("true");
    }

    const excluded = await request(app).options("/api/v1/rooms")
      .set("Origin", measurements ? "http://localhost:3000" : "http://localhost:3100")
      .set("Access-Control-Request-Method", "GET");

    expect(excluded.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
