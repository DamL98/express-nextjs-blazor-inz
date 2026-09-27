import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRateLimitConfiguration } from "../../src/config/rate-limit.js";
import { createAuthRateLimiter } from "../../src/middlewares/rate-limit.middleware.js";
import { errorMiddleware } from "../../src/middlewares/error.middleware.js";

beforeEach(() => {
  vi.stubEnv("RATE_LIMIT_ENABLED", undefined);
  vi.stubEnv("MEASUREMENT_DATABASE_ONLY", undefined);
  vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/inz");
});

afterEach(() => vi.unstubAllEnvs());

describe("Limiter logowania", () => {
  it("jest włączony domyślnie, a wyłączenie wymaga izolowanych pomiarów", () => {
    expect(getRateLimitConfiguration().isRateLimitEnabled).toBe(true);

    vi.stubEnv("RATE_LIMIT_ENABLED", "false");
    expect(() => getRateLimitConfiguration()).toThrow("Wyłączenie limitera");
  });

  it("zwraca 429 po przekroczeniu limitu", async () => {
    const app = express();
    app.post("/login", createAuthRateLimiter({ limit: 1 }), (_req, res) => res.sendStatus(204));
    app.use(errorMiddleware);

    await request(app).post("/login").expect(204);
    const limited = await request(app).post("/login").expect(429);

    expect(limited.body.code).toBe("AUTH_RATE_LIMITED");
    expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
  });
});
