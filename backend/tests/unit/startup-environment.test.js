import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getStartupEnvironment } from "../../src/config/startup-environment.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Profile uruchamiania", () => {
  it("production używa swojego portu i ustawień", () => {
    const environment = {
      NODE_ENV: "development", PORT: "4001", PORT_MEASUREMENTS: "4101",
      DATABASE_URL: "postgresql://localhost:5433/production",
      MEASUREMENT_DATABASE_ONLY: "true",
      RATE_LIMIT_ENABLED: "false",
    };

    const configured = { ...environment, ...getStartupEnvironment("production", environment) };
    expect(configured).toMatchObject({
      NODE_ENV: "production", PORT: "4001", DATABASE_URL: environment.DATABASE_URL,
      MEASUREMENT_DATABASE_ONLY: "false", RATE_LIMIT_ENABLED: "true",
    });
    expect(environment.NODE_ENV).toBe("development");
  });

  it("wersja z pomiarami ma własną bazę, adresy i cookie", () => {
    const environment = {
      PORT: "4000",
      PORT_MEASUREMENTS: "4200",
      AUTH_COOKIE_NAME: "auth",
      DATABASE_URL: "postgresql://localhost:5433/production",
      API_PUBLIC_URL: "https://api.example.com",
      FRONTEND_NEXT_URL: "https://example.com",
      GOOGLE_OAUTH_REDIRECT_URI: "https://api.example.com/callback",
    };

    // zgodność configa z .env
    const configured = { ...environment, ...getStartupEnvironment("measurements", environment) };
    expect(configured).toMatchObject({
      NODE_ENV: "production",
      PORT: "4200",
      MEASUREMENT_DATABASE_ONLY: "true",
      RATE_LIMIT_ENABLED: "false",
      API_PUBLIC_URL: "http://localhost:4200",
      FRONTEND_NEXT_URL: "http://localhost:3100",
      FRONTEND_BLAZOR_URL: "http://localhost:5177",
      GOOGLE_OAUTH_REDIRECT_URI: "http://localhost:4200/api/v1/auth/google/callback",
      GOOGLE_CALENDAR_OAUTH_REDIRECT_URI: "http://localhost:4200/api/v1/google-calendar/connect/callback",
      AUTH_COOKIE_NAME: "auth_measurements",
    });
    expect(new URL(configured.DATABASE_URL).pathname).toBe("/inz_measurements");
    expect(configured.DIRECT_URL).toBe(configured.DATABASE_URL);
  });

  it.each(["0", "abc"])("odrzuca nieprawidłowy port wersji do pomiarów: %s", (port) => {
    expect(() => getStartupEnvironment("measurements", { PORT_MEASUREMENTS: port })).toThrow("PORT_MEASUREMENTS");
  });

  it("blokada bazy produkcyjnej w pomiarach", () => {
    expect(() => getStartupEnvironment("measurements", {
      DATABASE_URL_MEASUREMENTS: "postgresql://localhost:5433/production",
    })).toThrow("DATABASE_URL_MEASUREMENTS");

    expect(() => getStartupEnvironment("unknown", {})).toThrow("Profil");
  });

});
