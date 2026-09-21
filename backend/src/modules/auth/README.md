# Moduł auth

Logowanie lokalne i Google korzystają z tego samego `User.id`, JWT aplikacji
i cookie `HttpOnly`. Połączenie Google zachowuje konto, rolę i rezerwacje.
Nie łączymy kont automatycznie po zgodności adresu e-mail.

## Uruchomienie

W katalogu `backend`:

```powershell
npm.cmd install
npx.cmd prisma generate --generator client
npm.cmd run prisma:migrate:deploy
npm.cmd run dev
```

Migracja `20260921130000_local_auth` dodaje opcjonalne hasło, opcjonalne `googleId`,
wersję sesji i tabelę jednorazowych tokenów. Nie usuwa istniejących kont.

Na `/login` w Next.js i Blazor dostępne są logowanie, rejestracja, ponowne wysłanie
potwierdzenia oraz reset hasła. Rejestracja wymaga potwierdzenia e-maila przed
pierwszym lokalnym logowaniem. Hasło musi mieć 15–128 znaków.

Bez `SMTP_URL`, poza produkcją, wiadomości zapisują się jako JSON w
`backend/.local-mail/` (katalog ignorowany przez Git). Otwórz link z pola `text`
w przeglądarce i potwierdź operację. Link wygasa po 30 minutach. Nie zapisujemy
tokenów w logach ani odpowiedziach API. W bazie przechowujemy wyłącznie ich hashe.

Do rzeczywistej wysyłki ustaw w środowisku backendu:

```dotenv
SMTP_URL=smtps://uzytkownik:haslo@serwer-smtp:465
MAIL_FROM=Rezerwacje <noreply@twoja-domena.pl>
```

Dane w URL muszą być zakodowane zgodnie ze składnią URL. W produkcji brak SMTP
zwraca `AUTH_MAIL_UNAVAILABLE`. Jeśli wysyłka po rejestracji nie powiedzie się,
konto pozostaje niepotwierdzone; po poprawieniu konfiguracji użyj ponownej wysyłki.

## Endpointy

Wszystkie ścieżki mają prefiks `/api/v1/auth`.

| Metoda i ścieżka | Dane / działanie |
|---|---|
| `POST /register` | `fullName`, `email`, `password`, `redirectTo`; konto i potwierdzenie |
| `POST /login` | `email`, `password`; wspólna sesja aplikacji |
| `POST /verification/request` | `email`, `redirectTo`; ponowna wysyłka |
| `POST /verify-email` | `token`; potwierdzenie adresu |
| `POST /password/forgot` | `email`, `redirectTo`; link resetowania |
| `POST /password/reset` | `token`, `password`; nowe hasło i unieważnienie sesji |
| `POST /password/change` | sesja, `currentPassword`, `password`; nowa sesja, unieważnienie poprzednich |
| `POST /google/link` | sesja, `password`, `redirectTo`; URL jawnego połączenia Google |
| `GET /google/url` | `redirectTo`; URL logowania Google i cookie procesu OAuth |
| `GET /google/start` | `redirectTo`; przekierowanie do Google |
| `GET /google/callback` | jednorazowy `state`, cookie procesu, kod Google |
| `POST /session` | istniejący interfejs Google ID token / authorization code |
| `GET /me` | publiczny profil bieżącej sesji, w tym `hasLocalPassword` |
| `POST /logout` | usunięcie cookie bieżącej przeglądarki |

`redirectTo` linków e-mail wskazuje `/auth/action` na dozwolonym frontendzie.
Token jest we fragmencie URL, usuwanym z paska adresu po otwarciu formularza.
Otwarcie linku samo nie zmienia konta — użytkownik potwierdza operację przyciskiem.

## Łączenie Google i kalendarza

Na stronie rezerwacji lokalny użytkownik wpisuje aktualne hasło w sekcji
„Konto i logowanie” i wybiera „Połącz konto Google”. Google pozwala wybrać konto.
Callback wymaga tej samej przeglądarki i aktualnej sesji inicjującej operację.
Zajęte `googleId` daje `ACCOUNT_LINK_CONFLICT`; nie scalamy dwóch użytkowników.
Lokalny e-mail i imię pozostają bez zmian, nawet gdy profil Google ma inne dane.

Po połączeniu dostępny jest osobny przycisk włączenia Kalendarza Google.
Zgoda na kalendarz nie jest wymagana do logowania ani rezerwowania sal.
Synchronizacja obejmuje nowe rezerwacje, bez automatycznego eksportu wcześniejszych.

## Zabezpieczenia i ograniczenia

- Argon2id dla haseł; publiczne odpowiedzi nie zawierają `passwordHash`.
- Jednorazowe tokeny OAuth i e-mail, sprawdzane i zużywane w transakcji.
- Zmiana/reset hasła zwiększa `sessionVersion`; middleware odrzuca starsze JWT.
- Limit 30 żądań lokalnego uwierzytelniania na IP w ciągu 15 minut. Magazyn limitu
  jest lokalny dla procesu; przy wielu instancjach potrzebuje wspólnego magazynu.
- Żądania zmieniające dane sprawdzają `Origin`/Fetch Metadata i format JSON.
- Takie same błędy dla nieistniejącego konta i złego hasła oraz ogólne odpowiedzi
  rejestracji i wysyłki linków.
- Wylogowanie usuwa cookie; globalne unieważnienie JWT następuje przy zmianie/resetowaniu hasła.

Testy: `npm.cmd test`. Testy integracji Google i wysyłki wiadomości używają atrap
zewnętrznych usług; nie wysyłają prawdziwych wiadomości i nie wywołują Google.
