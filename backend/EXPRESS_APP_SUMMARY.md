# Podsumowanie aplikacji Express.js

## Cel aplikacji

Aplikacja backendowa jest zbudowana w Express.js i pełni rolę API dla systemu rezerwacji sal. Aktualnie obsługuje podstawową konfigurację serwera, połączenie z bazą PostgreSQL przez Prisma ORM, endpoint zdrowia aplikacji oraz moduł sal konferencyjnych.

Backend jest przygotowany jako aplikacja warstwowa: routing, walidacja, kontrolery, logika biznesowa, repozytoria i baza danych są rozdzielone na osobne pliki.

## Technologie

- Node.js z modułami ES Modules
- Express 5.2.1 jako framework HTTP
- PostgreSQL jako baza danych
- Prisma ORM 7.8.0 jako warstwa dostępu do bazy
- `@prisma/adapter-pg` oraz `pg` jako adapter PostgreSQL
- Zod do walidacji danych wejściowych
- CORS do konfiguracji dostępu z frontendów
- cookie-parser do obsługi cookies
- dotenv do zmiennych środowiskowych
- Vitest i Supertest do testów integracyjnych
- Docker Compose do lokalnego uruchomienia PostgreSQL

## Struktura backendu

Najważniejsze elementy aplikacji:

- `src/app.js` - konfiguracja aplikacji Express, middleware, endpointy i routing
- `src/server.js` - uruchomienie serwera HTTP i połączenie z bazą danych
- `src/config/prisma.js` - konfiguracja klienta Prisma i połączenia z PostgreSQL
- `src/middlewares/validate.middleware.js` - walidacja requestów przez Zod
- `src/middlewares/error.middleware.js` - centralna obsługa błędów
- `src/middlewares/not-found.middleware.js` - obsługa nieistniejących tras
- `src/errors/apiError.js` - własna klasa błędu aplikacyjnego
- `src/utils/api-response.js` - wspólny format odpowiedzi sukcesu i błędu
- `src/modules/rooms` - moduł sal: routing, walidacja, kontrolery i serwis
- `src/repositories/room.repository.js` - zapytania do bazy dla sal i rezerwacji
- `prisma/schema.prisma` - model danych
- `prisma/seed.js` - dane startowe
- `tests/integration` - testy integracyjne API

## Aktualnie dostępne funkcje

### Health check

Aplikacja udostępnia endpoint sprawdzający stan API:

- `GET /health`
- `GET /api/v1/health`

Odpowiedź zawiera:

- status aplikacji
- nazwę serwisu
- aktualny timestamp

Przykładowy format odpowiedzi:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "reservation-system-api",
    "timestamp": "2026-05-27T08:00:00.000Z"
  }
}
```

### Lista sal

Endpoint:

```http
GET /api/v1/rooms
```

Zwraca listę sal z bazy danych, posortowaną rosnąco po nazwie.

Obsługiwane filtry query:

- `active=true` lub `active=false` - filtrowanie po aktywności sali
- `capacityMin=10` - filtrowanie sal o minimalnej pojemności

Przykłady:

```http
GET /api/v1/rooms?active=true
GET /api/v1/rooms?capacityMin=10
```

### Szczegóły sali

Endpoint:

```http
GET /api/v1/rooms/:id
```

Zwraca pojedynczą salę po identyfikatorze UUID. Jeżeli sala nie istnieje, API zwraca błąd `ROOM_NOT_FOUND` ze statusem HTTP 404.

### Dostępność sali

Endpoint:

```http
GET /api/v1/rooms/:id/availability?start=...&end=...
```

Sprawdza, czy sala jest dostępna w podanym przedziale czasu.

Parametry:

- `start` - data i czas rozpoczęcia w formacie ISO datetime
- `end` - data i czas zakończenia w formacie ISO datetime

API sprawdza kolizje z aktywnymi rezerwacjami tej samej sali. Rezerwacja koliduje, jeżeli jej `startTime` jest wcześniejsze niż żądane `end`, a jej `endTime` jest późniejsze niż żądane `start`.

Przykład:

```http
GET /api/v1/rooms/{roomId}/availability?start=2030-01-01T10:00:00.000Z&end=2030-01-01T11:00:00.000Z
```

Przykładowa odpowiedź:

```json
{
  "success": true,
  "data": {
    "roomId": "uuid",
    "available": true,
    "start": "2030-01-01T10:00:00.000Z",
    "end": "2030-01-01T11:00:00.000Z",
    "conflicts": []
  }
}
```

## Format odpowiedzi API

Aplikacja stosuje jeden wspólny format odpowiedzi.

Odpowiedź sukcesu:

```json
{
  "success": true,
  "data": {}
}
```

Odpowiedź błędu:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Opis błędu",
    "details": null
  }
}
```

Format jest budowany przez helpery:

- `successResponse(data)`
- `errorResponse(code, message, details)`

## Data flow

Główny przepływ danych w aplikacji:

```text
Request HTTP
  -> Express middleware
  -> Routing
  -> Walidacja Zod
  -> Controller
  -> Service
  -> Repository
  -> Prisma Client
  -> PostgreSQL
  -> Repository
  -> Service
  -> Controller
  -> successResponse / errorResponse
  -> Response HTTP
```

### Routing

Routing dla sal znajduje się w `src/modules/rooms/rooms.routes.js`.

Trasy są podpięte w `src/app.js` pod prefiksem:

```http
/api/v1/rooms
```

### Walidacja

Walidacja odbywa się przed wejściem do kontrolera. Middleware `validate` przyjmuje schemat Zod i wskazuje, czy walidowane są:

- `query`
- `params`

Poprawnie zwalidowane dane są zapisywane do:

```js
res.locals.validated
```

Dzięki temu kontroler nie musi korzystać bezpośrednio z surowego `req.query` lub `req.params`.

### Controller

Kontroler odpowiada za obsługę requestu i response. Nie zawiera bezpośrednich zapytań do bazy. Pobiera dane z `res.locals.validated`, wywołuje serwis i zwraca odpowiedź JSON.

### Service

Serwis zawiera logikę biznesową:

- pobieranie sal
- pobieranie sali po ID
- sprawdzanie, czy sala istnieje
- sprawdzanie poprawności zakresu czasu
- sprawdzanie dostępności sali
- rzucanie błędów aplikacyjnych przez `ApiError`

### Repository

Repozytorium odpowiada za komunikację z bazą danych przez Prisma:

- `findManyRooms`
- `findRoomById`
- `findConflictingRoomReservations`

To oddziela logikę biznesową od szczegółów zapytań SQL/Prisma.

## Obsługa błędów

Aplikacja ma centralny middleware błędów:

```js
errorMiddleware(error, req, res, next)
```

Express 5 automatycznie przekazuje błędy z asynchronicznych handlerów do error middleware. Oznacza to, że gdy kontroler lub serwis rzuci błąd, Express przekaże go do centralnej obsługi błędów.

Obsługiwane są:

- `ApiError` - błędy aplikacyjne z własnym statusem HTTP i kodem błędu
- `ZodError` - błędy walidacji
- obiekty błędów mające `statusCode` i `code`
- nieprzewidziane błędy jako `INTERNAL_SERVER_ERROR`

Przykładowe kody błędów:

- `VALIDATION_ERROR`
- `ROOM_NOT_FOUND`
- `INVALID_DATE`
- `INVALID_TIME_RANGE`
- `ROUTE_NOT_FOUND`
- `INTERNAL_SERVER_ERROR`

## Model danych

Model danych jest zdefiniowany w `prisma/schema.prisma`.

### Role

Tabela `roles` przechowuje role użytkowników.

Najważniejsze pola:

- `id`
- `name`
- `createdAt`

Relacja:

- jedna rola może być przypisana do wielu użytkowników

### User

Tabela `users` przechowuje użytkowników logujących się przez Google.

Najważniejsze pola:

- `id`
- `googleId`
- `email`
- `fullName`
- `avatarUrl`
- `roleId`
- `createdAt`
- `updatedAt`

Relacje:

- użytkownik ma jedną rolę
- użytkownik może mieć wiele rezerwacji
- użytkownik może mieć jedną integrację kalendarza

### Room

Tabela `rooms` przechowuje sale dostępne do rezerwacji.

Najważniejsze pola:

- `id`
- `name`
- `location`
- `description`
- `capacity`
- `isActive`
- `createdAt`
- `updatedAt`

Relacja:

- jedna sala może mieć wiele rezerwacji

### Reservation

Tabela `reservations` przechowuje rezerwacje sal.

Najważniejsze pola:

- `id`
- `userId`
- `roomId`
- `title`
- `description`
- `startTime`
- `endTime`
- `status`
- `googleCalendarEventId`
- `createdAt`
- `updatedAt`

Status rezerwacji:

- `ACTIVE`
- `CANCELLED`

Relacje:

- rezerwacja należy do jednego użytkownika
- rezerwacja dotyczy jednej sali

### CalendarIntegration

Tabela `calendar_integrations` przechowuje dane integracji użytkownika z kalendarzem.

Najważniejsze pola:

- `id`
- `userId`
- `provider`
- `calendarEmail`
- `refreshTokenEncrypted`
- `tokenExpiresAt`
- `createdAt`
- `updatedAt`

Relacja:

- jeden użytkownik może mieć jedną integrację kalendarza

## Reguły biznesowe obecne w kodzie

Aktualnie zaimplementowane reguły:

- sala musi istnieć, aby można było pobrać jej szczegóły
- sala musi istnieć, aby można było sprawdzić jej dostępność
- `start` i `end` muszą być poprawnymi datami
- `start` musi być wcześniejszy niż `end`
- dostępność sali jest liczona na podstawie aktywnych rezerwacji
- konflikt rezerwacji występuje, gdy przedziały czasowe się nakładają
- nieistniejąca sala zwraca błąd `ROOM_NOT_FOUND`

Reguły opisane w dokumentacji projektu, ale jeszcze niewystawione jako pełne endpointy:

- tworzenie rezerwacji
- anulowanie rezerwacji przez zmianę statusu
- blokowanie dwóch rezerwacji w tej samej sali w tym samym czasie
- synchronizacja rezerwacji z Google Calendar

## Dane startowe

Seed bazy znajduje się w `prisma/seed.js`.

Tworzone są role:

- `user`
- `admin`

Tworzone są przykładowe sale:

- Sala A101, aktywna, pojemność 12
- Sala B205, aktywna, pojemność 24
- Sala C310, nieaktywna, pojemność 6

Tworzeni są przykładowi użytkownicy:

- `admin@example.com` z rolą admin
- `user@example.com` z rolą user

## Konfiguracja środowiska

Aplikacja wymaga zmiennej środowiskowej:

```env
DATABASE_URL=...
```

Port API:

```env
PORT=4000
```

Jeżeli `PORT` nie zostanie ustawiony, aplikacja użyje portu `4000`.

CORS jest skonfigurowany dla frontendów:

- `FRONTEND_NEXT_URL` lub domyślnie `http://localhost:3000`
- `FRONTEND_BLAZOR_URL` lub domyślnie `http://localhost:5173`

## Docker i baza danych

Projekt zawiera `docker-compose.yml` z usługą PostgreSQL.

Domyślna konfiguracja lokalna:

- obraz: `postgres:17`
- kontener: `inzynierka_v1`
- baza: `inzynierka_db`
- port hosta: `5433`
- port kontenera: `5432`

Przydatne komendy:

```bash
docker-compose up -d
docker-compose down
docker compose down -v
```

## Prisma

Przydatne komendy:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run prisma:studio
```

Migracja tworzy tabele:

- `roles`
- `users`
- `rooms`
- `reservations`
- `calendar_integrations`

## Zabezpieczenia i mechanizmy ochronne

### Walidacja danych wejściowych

Requesty są walidowane przez Zod. Dzięki temu endpointy nie operują bezpośrednio na niezweryfikowanych danych z query params lub path params.

Walidowane są między innymi:

- UUID sali
- format daty ISO datetime
- wartość `active`
- minimalna pojemność sali jako dodatnia liczba całkowita

### Centralna obsługa błędów

Wszystkie błędy trafiają do jednego middleware. Pozwala to utrzymać spójny format odpowiedzi i nie ujawniać szczegółów błędów w produkcyjnej odpowiedzi API.

Stack trace jest zwracany tylko wtedy, gdy:

```js
process.env.NODE_ENV === "development"
```

### CORS

CORS ogranicza dozwolone originy do skonfigurowanych adresów frontendów. Włączona jest obsługa credentials.

### Separacja warstw

Kontrolery nie wykonują bezpośrednich zapytań do bazy. Dostęp do danych jest przeniesiony do repozytoriów, a logika biznesowa do serwisów. Zmniejsza to ryzyko mieszania odpowiedzialności i ułatwia testowanie.

### Prisma ORM

Zapytania do bazy są wykonywane przez Prisma Client, co ogranicza ryzyko ręcznego składania zapytań SQL i typowych błędów związanych z SQL injection.

### Ograniczenia obecnego stanu zabezpieczeń

W aktualnej wersji nie ma jeszcze pełnej implementacji:

- logowania użytkowników
- JWT middleware
- autoryzacji ról
- ochrony endpointów przed nieautoryzowanym dostępem
- rate limitingu
- helmet/security headers
- pełnej obsługi OAuth Google
- szyfrowania tokenów integracji w kodzie aplikacyjnym

Pakiety związane z auth i Google są już dodane, ale pełne endpointy autoryzacji nie są jeszcze zaimplementowane.

## Testy

Testy są oparte o:

- Vitest
- Supertest

Konfiguracja testów znajduje się w `vitest.config.js`.

Testy integracyjne znajdują się w:

```text
tests/integration
```

### Testy health

Plik:

```text
tests/integration/health.test.js
```

Sprawdza:

- `GET /api/v1/health` zwraca HTTP 200
- odpowiedź ma `success: true`
- status aplikacji to `ok`

### Testy rooms

Plik:

```text
tests/integration/rooms.test.js
```

Sprawdza:

- pobieranie listy sal
- filtrowanie aktywnych sal
- filtrowanie po minimalnej pojemności
- błąd walidacji dla niepoprawnej pojemności
- pobieranie pojedynczej sali
- błąd 404 dla nieistniejącej sali
- sprawdzanie dostępności sali
- błąd dla niepoprawnego zakresu czasu

Uruchomienie testów:

```bash
npm test
```

Na Windows, jeśli PowerShell blokuje `npm.ps1`, można użyć:

```bash
npm.cmd test
```

## Aktualny stan testów

Po uruchomieniu testów w obecnym stanie projektu:

```text
Test Files: 2 passed
Tests: 9 passed
```

Testy integracyjne dla sal wymagają działającego połączenia z bazą danych i danych startowych z seeda.

## Aktualne ograniczenia aplikacji

Aplikacja ma już fundament backendu, ale nie jest jeszcze kompletnym systemem rezerwacji.

Brakuje między innymi:

- endpointów do tworzenia rezerwacji
- endpointów do edycji i anulowania rezerwacji
- endpointów użytkowników
- logowania przez Google OAuth
- generowania i weryfikacji JWT
- autoryzacji ról user/admin
- endpointów integracji z Google Calendar
- testów jednostkowych serwisów
- testów dla middleware błędów i walidacji
- testów przypadków konfliktu rezerwacji
- pełnego mechanizmu blokowania nakładających się rezerwacji przy zapisie

## Wnioski

Backend Express ma już poprawny fundament architektoniczny:

- aplikacja jest podzielona na warstwy
- odpowiedzi API mają spójny format
- walidacja wejścia jest oddzielona od kontrolerów
- błędy są obsługiwane centralnie
- dostęp do bazy jest realizowany przez repozytoria i Prisma
- istnieją testy integracyjne dla obecnych endpointów
- baza danych ma przygotowany model pod użytkowników, role, sale, rezerwacje i integrację kalendarza

Najważniejszy kolejny etap rozwoju to dodanie modułu rezerwacji, autoryzacji użytkowników oraz pełnej obsługi konfliktów podczas tworzenia rezerwacji.
