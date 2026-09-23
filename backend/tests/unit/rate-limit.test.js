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

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

function configureMeasurementEnvironment() {
  vi.stubEnv("RATE_LIMIT_ENABLED", "false");
  vi.stubEnv("MEASUREMENT_DATABASE_ONLY", "true");
  vi.stubEnv("DATABASE_URL", "postgresql://localhost:5434/inz_measurements");
}

function createRateLimitTestApp() {
  const app = express();
  const protectedRouteHandler = vi.fn((_req, res) => res.sendStatus(204));
  const authRateLimiter = createAuthRateLimiter();
  app.post("/login", authRateLimiter, protectedRouteHandler);
  app.post("/register", authRateLimiter, protectedRouteHandler);
  app.use(errorMiddleware);
  return { app, protectedRouteHandler };
}

describe("Konfiguracja limitera", () => {
  it("domyślnie włącza ochronę", () => {
    expect(getRateLimitConfiguration().isRateLimitEnabled).toBe(true);
  });

  it("sama flaga pomiarowa nie wyłącza ochrony", () => {
    configureMeasurementEnvironment();
    vi.stubEnv("RATE_LIMIT_ENABLED", undefined);
    expect(getRateLimitConfiguration().isRateLimitEnabled).toBe(true);
  });

  it.each(["", "0", "FALSE", "disabled"])("odrzuca niepoprawną wartość %s", (rateLimitEnabledEnvValue) => {
    vi.stubEnv("RATE_LIMIT_ENABLED", rateLimitEnabledEnvValue);
    expect(() => getRateLimitConfiguration()).toThrow("RATE_LIMIT_ENABLED");
  });

  it("odrzuca wyłączenie bez flagi pomiarowej", () => {
    configureMeasurementEnvironment();
    vi.stubEnv("MEASUREMENT_DATABASE_ONLY", "false");
    expect(() => createAuthRateLimiter()).toThrow("Wyłączenie limitera");
  });

  it.each([
    "postgresql://localhost:5432/inz_measurements",
    "postgresql://localhost:5434/inz",
    "postgresql://example.com:5434/inz_measurements",
    "https://localhost:5434/inz_measurements",
    "niepoprawny-adres",
  ])("odrzuca wyłączenie dla bazy %s", (databaseUrl) => {
    configureMeasurementEnvironment();
    vi.stubEnv("DATABASE_URL", databaseUrl);
    expect(() => getRateLimitConfiguration()).toThrow("Wyłączenie limitera");
  });

  it("pozwala mierzyć produkcyjną kompilację w izolowanym środowisku", () => {
    configureMeasurementEnvironment();
    vi.stubEnv("NODE_ENV", "production");
    expect(getRateLimitConfiguration()).toEqual({ isRateLimitEnabled: false, isMeasurementModeEnabled: true, isMeasurementDatabaseConfigured: true });
  });

  it("pozwala włączyć ochronę do osobnych testów limitera", () => {
    configureMeasurementEnvironment();
    vi.stubEnv("RATE_LIMIT_ENABLED", "true");
    expect(getRateLimitConfiguration().isRateLimitEnabled).toBe(true);
  });
});

describe("Obsługa żądań przez limiter", () => {
  it("współdzieli limit tras, zwraca 429 requestIndex nie wykonuje kontrolera", async () => {
    const { app, protectedRouteHandler } = createRateLimitTestApp();
    for (let requestIndex = 0; requestIndex < 30; requestIndex++) {
      await request(app).post(requestIndex % 2 ? "/login" : "/register").expect(204);
    }
    const rateLimitedResponse = await request(app).post("/login?RATE_LIMIT_ENABLED=false")
      .set("RATE_LIMIT_ENABLED", "false").expect(429);
    expect(rateLimitedResponse.body.code).toBe("AUTH_RATE_LIMITED");
    expect(Number(rateLimitedResponse.headers["retry-after"])).toBeGreaterThan(0);
    expect(rateLimitedResponse.headers["ratelimit"]).toBeDefined();
    expect(protectedRouteHandler).toHaveBeenCalledTimes(30);
  });

  it("przywraca dostęp po upływie okna", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    const { app } = createRateLimitTestApp();
    for (let requestIndex = 0; requestIndex < 30; requestIndex++) await request(app).post("/login").expect(204);
    await request(app).post("/login").expect(429);
    await vi.advanceTimersByTimeAsync(15 * 60 * 1000 + 1);
    await request(app).post("/login").expect(204);
  });

  it("przepuszcza serię pomiarową bez nagłówków limitera", async () => {
    configureMeasurementEnvironment();
    const { app, protectedRouteHandler } = createRateLimitTestApp();
    for (let requestIndex = 0; requestIndex < 35; requestIndex++) {
      const measurementResponse = await request(app).post("/login").expect(204);
      expect(measurementResponse.headers["ratelimit"]).toBeUndefined();
    }
    expect(protectedRouteHandler).toHaveBeenCalledTimes(35);
  });
});
