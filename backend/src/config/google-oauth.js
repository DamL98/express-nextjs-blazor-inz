import { google } from "googleapis";
import {
  GoogleOAuthConfigurationError,
  GoogleOAuthValidationError,
} from "./config.errors.js";
import { getGoogleOAuthEnvironment } from "./environment.js";

const GOOGLE_IDENTITY_SCOPES = ["openid", "email", "profile"];
export const GOOGLE_CALENDAR_SCOPES = [
  ...GOOGLE_IDENTITY_SCOPES,
  "https://www.googleapis.com/auth/calendar.events",
];

export function validateGoogleOAuthConfiguration() {
  const config = getGoogleOAuthEnvironment();
  const missing = [];

  if (!config.clientId) {
    missing.push("GOOGLE_OAUTH_CLIENT_ID");
  }

  if (!config.clientSecret) {
    missing.push("GOOGLE_OAUTH_CLIENT_SECRET");
  }

  if (missing.length > 0) {
    throw new GoogleOAuthConfigurationError(
      `Brak wymaganej konfiguracji Google OAuth: ${missing.join(", ")}`,
    );
  }
}

export function getGoogleOAuthRedirectUri() {
  return getGoogleOAuthEnvironment().loginRedirectUri;
}

export function getGoogleCalendarOAuthRedirectUri() {
  return getGoogleOAuthEnvironment().calendarRedirectUri;
}



function parseRedirectUrl(value) {
  try {
    return new URL(value);
  } catch (error) {
    throw new GoogleOAuthValidationError("Nieprawidlowy redirect URL", {
      cause: error,
    });
  }
}

function buildAllowedFrontendOrigins() {
  try {
    return new Set(
      getGoogleOAuthEnvironment().allowedFrontendOrigins.map(
        (origin) => new URL(origin).origin,
      ),
    );
  } catch (error) {
    throw new GoogleOAuthConfigurationError(
      "Nieprawidlowy URL frontendu w konfiguracji",
      { cause: error },
    );
  }
}

// Redirect może wskazywać dowolną ścieżkę, ale tylko na dozwolonym frontendzie.
export function validateFrontendRedirectUrl(value) {
  const redirectUrl = value?.trim() ||
    getGoogleOAuthEnvironment().defaultSuccessUrl;
  const url = parseRedirectUrl(redirectUrl);
  const allowedOrigins = buildAllowedFrontendOrigins();

  if (!allowedOrigins.has(url.origin)) {
    throw new GoogleOAuthValidationError(
      `Niedozwolony redirect z frontendu ${url.origin}`,
    );
  }

  return url.toString();
}

export function createGoogleOAuthClient(redirectUri = getGoogleOAuthRedirectUri()) {
  validateGoogleOAuthConfiguration();
  const config = getGoogleOAuthEnvironment();

  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
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
    throw new GoogleOAuthValidationError("Google nie zwrocil user id");
  }

  if (!profile?.email) {
    throw new GoogleOAuthValidationError("Google nie zwrocil email usera");
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
// audience sprawdza, czy token został wystawiony dla tej aplikacji
// sciagamy tylko payload z wyniku
// mapuje pola od Googla na lokalny obiekt usera

export async function verifyGoogleIdToken(idToken) {
  const client = createGoogleOAuthClient();
  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: getGoogleOAuthEnvironment().clientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new GoogleOAuthValidationError("Nieprawidlowy token Google", {
      cause: error,
    });
  }

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
  let tokens;
  let profile;

  try {
    ({ tokens } = await client.getToken(code));

    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      version: "v2",
      auth: client,
    });
    const { data } = await oauth2.userinfo.get();
    profile = data;
  } catch (error) {
    throw new GoogleOAuthValidationError(
      "Nieprawidlowy kod autoryzacyjny Google",
      { cause: error },
    );
  }

  // zwraca Usera w lokalnym formacie
  // RAW tokeny od Google
  return {
    googleUser: normalizeGoogleProfile(profile),
    tokens,
  };
}
