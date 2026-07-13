import { google } from "googleapis";

const GOOGLE_SCOPES = ["openid", "email", "profile"];

class GoogleOAuthConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "GoogleOAuthConfigError";
  }
}

class GoogleOAuthValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "GoogleOAuthValidationError";
  }
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new GoogleOAuthConfigError(`Brak ${name} w configu backendu`);
  }

  return value;
}

export function getGoogleClientId() {
  return requiredEnv("GOOGLE_OAUTH_CLIENT_ID");
}

function getGoogleClientSecret() {
  return requiredEnv("GOOGLE_OAUTH_CLIENT_SECRET");
}

export function getGoogleOAuthRedirectUri() {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
    `http://localhost:${process.env.PORT || 4000}/api/v1/auth/google/callback`
  );
}

export function getAllowedFrontendOrigins() {
  return [
    process.env.FRONTEND_NEXT_URL?.trim(),
    process.env.FRONTEND_BLAZOR_URL?.trim(),
  ].filter(Boolean);
}

export function getDefaultFrontendRedirectUrl() {
  return (
    process.env.GOOGLE_OAUTH_DEFAULT_SUCCESS_URL?.trim() ||
    getAllowedFrontendOrigins()[0] ||
    "http://localhost:3000"
  );
}

export function validateFrontendRedirectUrl(value) {
  const redirectUrl = value?.trim() || getDefaultFrontendRedirectUrl();
  const url = new URL(redirectUrl);
  const allowedOrigins = new Set(
    getAllowedFrontendOrigins().map((origin) => new URL(origin).origin),
  );

  if (!allowedOrigins.has(url.origin)) {
    throw new GoogleOAuthValidationError(
      `Niedozwolony redirect z frontendu ${url.origin} dozwolone tylko: ${[...allowedOrigins].join(", ")}`,
    );
  }

  return url.toString();
}

export function createGoogleOAuthClient(redirectUri = getGoogleOAuthRedirectUri()) {
  return new google.auth.OAuth2(
    getGoogleClientId(),
    getGoogleClientSecret(),
    redirectUri,
  );
}

function normalizeGoogleProfile(profile) {
  if (!profile?.id) {
    throw new Error("Google nie zwrocil user id");
  }

  if (!profile?.email) {
    throw new Error("Google nie zwrocil email usera");
  }

  return {
    googleId: profile.id,
    email: profile.email.trim().toLowerCase(),
    fullName: profile.name?.trim() || profile.email.split("@")[0],
    avatarUrl: profile.picture || null,
    emailVerified: Boolean(profile.verified_email),
  };
}

export function buildGoogleAuthorizationUrl({ state }) {
  return createGoogleOAuthClient().generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent select_account",
    scope: GOOGLE_SCOPES,
    state,
  });
}

export async function verifyGoogleIdToken(idToken) {
  const client = createGoogleOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: getGoogleClientId(),
  });
  const payload = ticket.getPayload();

  return normalizeGoogleProfile({
    id: payload?.sub,
    email: payload?.email,
    name: payload?.name,
    picture: payload?.picture,
    verified_email: payload?.email_verified,
  });
}

export async function exchangeGoogleCodeForProfile(code, redirectUri = getGoogleOAuthRedirectUri()) {
  const client = createGoogleOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);

  client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    version: "v2",
    auth: client,
  });
  const { data } = await oauth2.userinfo.get();

  return normalizeGoogleProfile(data);
}

export { GoogleOAuthConfigError, GoogleOAuthValidationError };
