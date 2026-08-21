# Moduł auth
Moduł obsługuje wyłącznie logowanie kontem Google
Na razie brak lokalnej rejestracji/logowania

## Use Case's

- `GET /api/v1/auth/google/url` — zwraca adres rozpoczęcia Google OAuth.
- `GET /api/v1/auth/google/start` — przekierowuje bezpośrednio do Google.
- `GET /api/v1/auth/google/callback` — wymienia kod Google na profil i sesję aplikacji.
- `POST /api/v1/auth/session` — tworzy sesję z Google ID tokenu albo authorization code.
- `GET /api/v1/auth/me` — zwraca użytkownika aktualnej sesji.
- `POST /api/v1/auth/logout` — usuwa cookie sesyjne.

## Data-Flow

1. Frontend pobiera URL autoryzacji albo wywołuje endpoint startowy.
2. Backend zapisuje do podpisanego `state` dozwolony adres powrotu.
3. Google zwraca `code` do callbacku backendu.
4. Backend wymienia `code` na profil Google.
5. Serwis tworzy lub aktualizuje użytkownika według `googleId` i e-maila.
6. Backend tworzy własny JWT sesyjny i zapisuje go w cookie `HttpOnly`.
7. Frontend używa cookie albo nagłówka `Authorization: Bearer` przy kolejnych żądaniach.

## Edge Case's

- Brak ID tokenu i kodu: `GOOGLE_AUTH_PAYLOAD_REQUIRED`.
- Nieprawidłowy lub wygasły token/kod Google: `GOOGLE_AUTH_FAILED`.
- Brak konfiguracji Google OAuth: `GOOGLE_OAUTH_NOT_CONFIGURED`.
- Brak identyfikatora lub e-maila w profilu: `GOOGLE_ACCOUNT_INCOMPLETE`.
- E-mail powiązany z innym kontem: `ACCOUNT_LINK_CONFLICT`.
- Odrzucona zgoda Google albo brak kodu callbacku: `GOOGLE_AUTH_DENIED` lub `GOOGLE_AUTH_CODE_REQUIRED`.
- Nieprawidłowy `state` lub adres spoza dozwolonych frontendów: kontrolowany błąd OAuth.
- Brak, wygaśnięcie lub uszkodzenie sesji: `AUTH_TOKEN_REQUIRED`, `AUTH_TOKEN_INVALID` albo `AUTH_SESSION_INVALID`.

Błędy HTTP są zwracane jako `application/problem+json` zgodnie z RFC 9457. Szczegóły techniczne pozostają w logach backendu.
