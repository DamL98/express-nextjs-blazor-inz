import { google } from "googleapis";

const GOOGLE_IDENTITY_SCOPES = ["openid", "email", "profile"];
export const GOOGLE_CALENDAR_SCOPES = [
  ...GOOGLE_IDENTITY_SCOPES,
  "https://www.googleapis.com/auth/calendar.events",
];

// ERROR HANLDING START - DLA GOOGLE OAUTH
const GOOGLE_OAUTH_CONFIG_ERROR = "GoogleOAuthConfigError";
const GOOGLE_OAUTH_VALIDATION_ERROR = "GoogleOAuthValidationError";

function createNamedError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

export function createGoogleOAuthConfigError(message) {
  return createNamedError(GOOGLE_OAUTH_CONFIG_ERROR, message);
}

export function createGoogleOAuthValidationError(message) {
  return createNamedError(GOOGLE_OAUTH_VALIDATION_ERROR, message);
}

export function isGoogleOAuthConfigError(error) {
  return error instanceof Error && error.name === GOOGLE_OAUTH_CONFIG_ERROR;
}

export function isGoogleOAuthValidationError(error) {
  return error instanceof Error && error.name === GOOGLE_OAUTH_VALIDATION_ERROR;
}
// ERROR HANLDING END




// POBRANIE SECRETS Z .ENV (projekt googla)
function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw createGoogleOAuthConfigError(`Brak ${name} w configu backendu`);
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

export function getGoogleCalendarOAuthRedirectUri() {
  return (
    process.env.GOOGLE_CALENDAR_OAUTH_REDIRECT_URI?.trim() ||
    `http://localhost:${process.env.PORT || 4000}/api/v1/google-calendar/connect/callback`
  );
}
// POBRANIE SECRETS END



// CQRS
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



// local redirect url na nextjs(:3000) i blazor (:)
//
export function validateFrontendRedirectUrl(value) {
  const redirectUrl = value?.trim() || getDefaultFrontendRedirectUrl();
  const url = new URL(redirectUrl);
  const allowedOrigins = new Set(
    getAllowedFrontendOrigins().map((origin) => new URL(origin).origin),
  );

  if (!allowedOrigins.has(url.origin)) {
    throw createGoogleOAuthValidationError(
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

// *****************************************************************
// formatuje dane profilu od Googla na lokalny obiekt Usera
//
// wymagane id i email od googla
// fullname - bierze nazwe z google a jesli brak uzywa czesci nazwy przed @
// emailVerified - zamienia na true/flase
// *****************************************************************
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

// *****************************************************************
// START LOGOWANIA
// budowanie URL - przekierowanie usera na ekran zgody logowania / uwierzytelnianie
//
// state - przenosi kontekst miedzy startem oauth i callbackiem
// scope - domyslne uprawnienia o ktore prosze usera przy jego logowaniu
// redirectUri - adres backendu / Google rzuci tam usera po jego zgodzie logowania
// access_type - informujemy google ze wymagamy refresh_token
// include_granted_scopes: true - pozwala zachować wczesniejsze zgody Usera
// prompt: "consent select_account" - wymusza pokazanie ekranu zgody logowania i wyboru konta google
export function buildGoogleAuthorizationUrl({
  state,
  scope = GOOGLE_IDENTITY_SCOPES,
  redirectUri = getGoogleOAuthRedirectUri(),
}) {
  return createGoogleOAuthClient(redirectUri).generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent select_account",
    scope,
    state,
  });
}


// *****************************************************************
// sprawdzamy czy google na pewno potwierdzil/uwierzytelnil usera
//
//
// audience: getGoogleClientId() - czy token wystawiony dla tej apki
// sciagamy tylko payload z wyniku
// mapuje pola od Googla na lokalny obiekt usera

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



// *****************************************************************
// CZĘŚĆ JUŻ PO PRZEKIEROWANIU Z GOOGLA I OTRZYMANIU code z OAuth
//
// wrapper tylko Profilu Google Usera za code z OAuth
export async function exchangeGoogleCodeForProfile(code, redirectUri = getGoogleOAuthRedirectUri()) {
  const { googleUser } = await exchangeGoogleCode(code, redirectUri);
  return googleUser;
}

// wymienia authorization code na -> tokeny i dane Usera
// tworzy klienta oauth google -> dostaje ten sam redirectUri, ktory byl uzyty przy starcie logowania
export async function exchangeGoogleCode(code, redirectUri = getGoogleOAuthRedirectUri()) {
  const client = createGoogleOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);

  // zapisuje tokeny w kliencie
  // potrzebne bo pozneijsze requesty odpytuja juz jako Zalogowany User
  client.setCredentials(tokens);

  // tworzy klienta do Google OAuth2 API
  // uzywane do pobrania info o profilu Google
  const oauth2 = google.oauth2({
    version: "v2",
    auth: client,
  });
  const { data } = await oauth2.userinfo.get();

  // zwraca Usera w lokalnym formacie
  // RAW tokeny od Google
  return {
    googleUser: normalizeGoogleProfile(data),
    tokens,
  };
}
