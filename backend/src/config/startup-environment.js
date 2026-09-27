import { ConfigurationError } from "./config.errors.js";

export function getStartupEnvironment(profile, environment) {
  if (!["production", "measurements"].includes(profile)) {
    throw new ConfigurationError("Profil uruchomienia musi byc production albo measurements");
  }

  const measurements = profile === "measurements";
  const portName = measurements ? "PORT_MEASUREMENTS" : "PORT";
  const port = environment[portName]?.trim() || (measurements ? "4100" : "4000");
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new ConfigurationError(`${portName} musi byc portem od 1 do 65535`);
  }

  const result = {
    NODE_ENV: "production",
    PORT: port,
    MEASUREMENT_DATABASE_ONLY: String(measurements),
    RATE_LIMIT_ENABLED: String(!measurements),
  };

  if (!measurements) return result;

  const databaseUrl = environment.DATABASE_URL_MEASUREMENTS?.trim() ||
    "postgresql://measurement:local-measurement-only@localhost:5434/inz_measurements";
  let database;
  try {
    database = new URL(databaseUrl);
  } catch {
    throw new ConfigurationError("Niepoprawny DATABASE_URL_MEASUREMENTS");
  }

  if (!["postgres:", "postgresql:"].includes(database.protocol) ||
      database.hostname !== "localhost" || database.port !== "5434" ||
      database.pathname !== "/inz_measurements") {
    throw new ConfigurationError("DATABASE_URL_MEASUREMENTS musi wskazywac localhost:5434/inz_measurements");
  }

  const apiUrl = `http://localhost:${port}`;

  return {
    ...result,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    API_PUBLIC_URL: apiUrl,
    FRONTEND_NEXT_URL: "http://localhost:3100",
    FRONTEND_BLAZOR_URL: "http://localhost:5177",
    GOOGLE_OAUTH_DEFAULT_SUCCESS_URL: "http://localhost:3100",
    GOOGLE_OAUTH_REDIRECT_URI: `${apiUrl}/api/v1/auth/google/callback`,
    GOOGLE_CALENDAR_OAUTH_REDIRECT_URI: `${apiUrl}/api/v1/google-calendar/connect/callback`,
    // Cookies are shared across localhost ports; keep the two sessions separate.
    AUTH_COOKIE_NAME: environment.AUTH_COOKIE_NAME_MEASUREMENTS?.trim() ||
      `${environment.AUTH_COOKIE_NAME?.trim() || "session"}_measurements`,
  };
}
