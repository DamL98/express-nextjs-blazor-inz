function createProblem(code, status, title, detail = title) {
  return Object.freeze({
    type: `/problems/${code.toLowerCase().replaceAll("_", "-")}`,
    title,
    status,
    code,
    detail,
  });
}

export const ProblemDefinitions = Object.freeze({
  // Ogolne bledy HTTP
  BAD_REQUEST: createProblem("BAD_REQUEST", 400, "Nieprawidlowe zadanie"),
  VALIDATION_ERROR: createProblem(
    "VALIDATION_ERROR",
    400,
    "Nieprawidlowe dane wejsciowe",
  ),
  UNAUTHORIZED: createProblem(
    "UNAUTHORIZED",
    401,
    "Wymagane uwierzytelnienie",
  ),
  FORBIDDEN: createProblem("FORBIDDEN", 403, "Brak uprawnien"),
  NOT_FOUND: createProblem("NOT_FOUND", 404, "Nie znaleziono zasobu"),
  CONFLICT: createProblem("CONFLICT", 409, "Konflikt zasobu"),
  TOO_MANY_REQUESTS: createProblem(
    "TOO_MANY_REQUESTS",
    429,
    "Zbyt wiele zadan",
  ),
  ROUTE_NOT_FOUND: createProblem(
    "ROUTE_NOT_FOUND",
    404,
    "Nie znaleziono endpointu",
  ),

  // Bledy serwera / infra
  SERVICE_UNAVAILABLE: createProblem(
    "SERVICE_UNAVAILABLE",
    503,
    "Usluga niedostepna",
  ),
  INTERNAL_SERVER_ERROR: createProblem(
    "INTERNAL_SERVER_ERROR",
    500,
    "Wewnetrzny blad serwera",
    "Wystapil nieoczekiwany blad serwera",
  ),

  // Uwierzytelnianie i ggl OAuth
  AUTH_TOKEN_REQUIRED: createProblem(
    "AUTH_TOKEN_REQUIRED",
    401,
    "Wymagane zalogowanie",
    "Brak tokenu sesji",
  ),
  AUTH_TOKEN_INVALID: createProblem(
    "AUTH_TOKEN_INVALID",
    401,
    "Nieprawidlowa sesja",
    "Token sesji jest nieprawidlowy lub wygasl",
  ),
  AUTH_SESSION_INVALID: createProblem(
    "AUTH_SESSION_INVALID",
    401,
    "Sesja wygasla",
    "Sesja wygasla lub uzytkownik nie istnieje",
  ),
  GOOGLE_AUTH_PAYLOAD_REQUIRED: createProblem(
    "GOOGLE_AUTH_PAYLOAD_REQUIRED",
    400,
    "Brak danych uwierzytelnienia Google",
  ),
  GOOGLE_OAUTH_NOT_CONFIGURED: createProblem(
    "GOOGLE_OAUTH_NOT_CONFIGURED",
    503,
    "Google OAuth jest niedostepne",
  ),
  GOOGLE_AUTH_FAILED: createProblem(
    "GOOGLE_AUTH_FAILED",
    401,
    "Uwierzytelnienie Google nie powiodlo sie",
  ),
  INVALID_GOOGLE_REDIRECT: createProblem(
    "INVALID_GOOGLE_REDIRECT",
    400,
    "Nieprawidlowy adres przekierowania Google",
  ),
  GOOGLE_AUTH_DENIED: createProblem(
    "GOOGLE_AUTH_DENIED",
    401,
    "Google OAuth odrzucilo logowanie",
  ),
  GOOGLE_AUTH_CODE_REQUIRED: createProblem(
    "GOOGLE_AUTH_CODE_REQUIRED",
    400,
    "Brak kodu autoryzacyjnego Google",
  ),
  GOOGLE_ACCOUNT_INCOMPLETE: createProblem(
    "GOOGLE_ACCOUNT_INCOMPLETE",
    403,
    "Niekompletne konto Google",
  ),
  ACCOUNT_LINK_CONFLICT: createProblem(
    "ACCOUNT_LINK_CONFLICT",
    409,
    "Konflikt powiazania konta",
  ),

  // Integracje ggl calendar
  GOOGLE_CALENDAR_NOT_CONFIGURED: createProblem(
    "GOOGLE_CALENDAR_NOT_CONFIGURED",
    503,
    "Google Calendar jest niedostepny",
  ),
  GOOGLE_CALENDAR_STATE_REQUIRED: createProblem(
    "GOOGLE_CALENDAR_STATE_REQUIRED",
    400,
    "Brak stanu polaczenia Google Calendar",
  ),
  GOOGLE_CALENDAR_STATE_INVALID: createProblem(
    "GOOGLE_CALENDAR_STATE_INVALID",
    400,
    "Nieprawidlowy stan polaczenia Google Calendar",
  ),
  GOOGLE_ACCOUNT_MISMATCH: createProblem(
    "GOOGLE_ACCOUNT_MISMATCH",
    409,
    "Niezgodne konto Google",
  ),
  GOOGLE_REFRESH_TOKEN_MISSING: createProblem(
    "GOOGLE_REFRESH_TOKEN_MISSING",
    400,
    "Brak refresh tokenu Google",
  ),

  // Logika biznesowa sal - rooms
  ROOM_NOT_FOUND: createProblem("ROOM_NOT_FOUND", 404, "Nie znaleziono sali"),
  ROOM_INACTIVE: createProblem(
    "ROOM_INACTIVE",
    400,
    "Sala jest nieaktywna",
    "Nie mozna zarezerwowac nieaktywnej sali",
  ),

  // Logika biznesowa rezerwacji - reservations
  INVALID_DATE: createProblem("INVALID_DATE", 400, "Nieprawidlowa data"),
  INVALID_DATE_FORMAT: createProblem(
    "INVALID_DATE_FORMAT",
    400,
    "Nieprawidlowy format daty",
  ),
  INVALID_TIME_RANGE: createProblem(
    "INVALID_TIME_RANGE",
    400,
    "Nieprawidlowy zakres czasu",
    "Czas rozpoczecia musi byc wczesniejszy niz czas zakonczenia",
  ),
  RESERVATION_IN_PAST: createProblem(
    "RESERVATION_IN_PAST",
    400,
    "Rezerwacja jest w przeszlosci",
    "Nie mozna utworzyc rezerwacji w przeszlosci",
  ),
  RESERVATION_NOT_FOUND: createProblem(
    "RESERVATION_NOT_FOUND",
    404,
    "Nie znaleziono rezerwacji",
  ),
  ROOM_ALREADY_RESERVED: createProblem(
    "ROOM_ALREADY_RESERVED",
    409,
    "Termin sali jest zajety",
    "Sala jest juz zarezerwowana w wybranym terminie",
  ),
});

export function findProblemByType(type) {
  return Object.values(ProblemDefinitions).find(
    (definition) => definition.type === type,
  ) ?? null;
}
