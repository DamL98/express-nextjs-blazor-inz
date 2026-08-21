# Moduł Google Calendar
## Use-Case's

- `GET /api/v1/google-calendar/status` — zwraca stan połączenia.
- `GET /api/v1/google-calendar/connect/start` — rozpoczyna zgodę na dostęp do wydarzeń.
- `GET /api/v1/google-calendar/connect/callback` — zapisuje połączenie i wraca na frontend.
- `DELETE /api/v1/google-calendar/connection` — usuwa lokalne połączenie.
- Utworzenie rezerwacji — próbuje utworzyć wydarzenie w kalendarzu.
- Usunięcie rezerwacji — próbuje usunąć powiązane wydarzenie.

## Data-Flow

1. Zalogowany frontend wysyła `redirectTo` do endpointu startowego.
2. Backend waliduje origin i tworzy podpisany `state` zawierający `userId`, cel procesu i adres powrotu.
3. Google zwraca `code` i `state` do publicznego callbacku backendu.
4. Backend weryfikuje `state`, pobiera użytkownika i wymienia kod na profil oraz tokeny Google.
5. Serwis sprawdza, czy konto Google jest tym samym kontem, którego użyto do logowania.
6. Refresh token jest szyfrowany i zapisywany w `CalendarIntegration`.
7. Callback przekierowuje frontend ze statusem `connected` albo `error`.
8. Podczas zmian rezerwacji backend używa zapisanego tokenu do wywołania Google Calendar API.

## Edge-Case's

- Brak lub nieprawidłowy `state`: `GOOGLE_CALENDAR_STATE_REQUIRED` albo `GOOGLE_CALENDAR_STATE_INVALID`.
- Adres powrotu spoza dozwolonych frontendów: `INVALID_GOOGLE_REDIRECT`.
- Brak konfiguracji OAuth lub szyfrowania: `GOOGLE_CALENDAR_NOT_CONFIGURED`.
- Inne konto Google niż konto logowania: `GOOGLE_ACCOUNT_MISMATCH`.
- Brak refresh tokenu po zgodzie: `GOOGLE_REFRESH_TOKEN_MISSING`.
- Odmowa zgody lub brak kodu: przekierowanie na frontend z parametrem błędu.
- Brak lokalnego połączenia: status `connected: false`; synchronizacja jest pomijana.
- Błąd Google podczas synchronizacji: rezerwacja pozostaje zapisana, a błąd trafia do logów.
- Brak identyfikatora utworzonego wydarzenia: rezerwacja pozostaje bez powiązania z wydarzeniem.
- Usunięcie połączenia usuwa dane lokalne; nie odwołuje zgody na koncie Google.

Błędy endpointów API są zwracane jako `application/problem+json` zgodnie z RFC 9457
Callback OAuth używa przekierowania bo odbiorcą jest przeglądarka
