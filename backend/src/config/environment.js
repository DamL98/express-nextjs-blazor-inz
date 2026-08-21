function read(name) {
  return process.env[name]?.trim();
}

export function getApplicationEnvironment() {
  return {
    port: Number(read("PORT") || 4000),
    isProduction: read("NODE_ENV") === "production",
    frontendNextUrl: read("FRONTEND_NEXT_URL") || "http://localhost:3000",
    frontendBlazorUrl: read("FRONTEND_BLAZOR_URL") || "http://localhost:5173",
  };
}

export function getDatabaseEnvironment() {
  return {
    connectionString: read("DATABASE_URL"),
  };
}

export function getAuthEnvironment() {
  return {
    jwtSecret: read("JWT_SECRET"),
    cookieName: read("AUTH_COOKIE_NAME"),
    sessionTtl: read("AUTH_SESSION_TTL"),
    cookieMaxAgeMs: Number(read("AUTH_COOKIE_MAX_AGE_MS")),
    sessionAudience: read("AUTH_SESSION_TOKEN_AUDIENCE"),
    sessionIssuer: read("AUTH_SESSION_TOKEN_ISSUER"),
    oauthStateAudience: read("AUTH_TOKEN_AUDIENCE"),
    oauthStateTtl: read("AUTH_TOKEN_TTL"),
  };
}

export function getGoogleOAuthEnvironment() {
  const app = getApplicationEnvironment();

  return {
    clientId: read("GOOGLE_OAUTH_CLIENT_ID"),
    clientSecret: read("GOOGLE_OAUTH_CLIENT_SECRET"),
    loginRedirectUri: read("GOOGLE_OAUTH_REDIRECT_URI") ||
      `http://localhost:${app.port}/api/v1/auth/google/callback`,
    calendarRedirectUri: read("GOOGLE_CALENDAR_OAUTH_REDIRECT_URI") ||
      `http://localhost:${app.port}/api/v1/google-calendar/connect/callback`,
    defaultSuccessUrl: read("GOOGLE_OAUTH_DEFAULT_SUCCESS_URL") ||
      app.frontendNextUrl,
    allowedFrontendOrigins: [app.frontendNextUrl, app.frontendBlazorUrl],
  };
}

export function getGoogleCalendarEnvironment() {
  return {
    encryptionKey: read("GOOGLE_TOKEN_ENCRYPTION_KEY"),
    encryptionAlgorithm: read("GOOGLE_TOKEN_ENCRYPTION_ALGORITHM") ||
      "aes-256-gcm",
    encryptionIvLength: Number(read("GOOGLE_TOKEN_ENCRYPTION_IV_LENGTH") || 12),
  };
}
