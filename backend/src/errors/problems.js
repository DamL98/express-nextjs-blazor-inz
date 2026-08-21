// standard IETF RFC - https://datatracker.ietf.org/doc/html/rfc9457
function createProblem(code, status, title, detail = title) {
  return {
    type: `/problems/${code.toLowerCase().replaceAll("_", "-")}`,
    title,
    status,
    code,
    detail,
  };
}

export const Problems = {
  VALIDATION_ERROR: createProblem(
    "VALIDATION_ERROR",
    400,
    "Nieprawidlowe dane wejsciowe",
  ),
  FORBIDDEN: createProblem("FORBIDDEN", 403, "Brak uprawnien"),
  ROUTE_NOT_FOUND: createProblem(
    "ROUTE_NOT_FOUND",
    404,
    "Nie znaleziono endpointu",
  ),
  INTERNAL_SERVER_ERROR: createProblem(
    "INTERNAL_SERVER_ERROR",
    500,
    "Wewnetrzny blad serwera",
    "Wystapil nieoczekiwany blad serwera",
  ),

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

  ROOM_NOT_FOUND: createProblem("ROOM_NOT_FOUND", 404, "Nie znaleziono sali"),
  ROOM_INACTIVE: createProblem(
    "ROOM_INACTIVE",
    400,
    "Sala jest nieaktywna",
    "Nie mozna zarezerwowac nieaktywnej sali",
  ),

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
};
