# Podsumowanie backendu

Backend jest aplikacja Node.js oparta o Express, Prisma, PostgreSQL i Zod. Aktualnie ma rozdzielone moduly domenowe `rooms`, `reservations` oraz `admin`.

## Stack

- Node.js z ESM.
- Express 5.
- Prisma 7.
- PostgreSQL.
- Zod.
- Vitest + Supertest.

## Struktura

```text
backend/src/
  app.js
  server.js
  config/
  errors/
  middlewares/
  modules/
    admin/
    reservations/
    rooms/
  repositories/
    admin.repository.js
    reservation.repository.js
    room.repository.js
  utils/
```

## Routing

W `src/app.js` zamontowane sa:

```text
GET /health
GET /api/v1/health

/api/v1/rooms
/api/v1/reservations
/api/v1/admin
```

## Modul rooms

Modul odpowiada za liste sal, szczegoly sali oraz sprawdzanie dostepnosci.

Endpointy:

```text
GET /api/v1/rooms
GET /api/v1/rooms/:id
GET /api/v1/rooms/:id/availability
```

Obslugiwane filtry:

- `active=true|false`
- `capacityMin`

Najwazniejsze bledy:

- `ROOM_NOT_FOUND`
- `INVALID_DATE`
- `INVALID_TIME_RANGE`
- `VALIDATION_ERROR`

## Modul reservations

Modul odpowiada za rezerwacje zwyklego uzytkownika. Aktualnie korzysta z mock usera `user@example.com`.

Endpointy:

```text
GET /api/v1/reservations/my
GET /api/v1/reservations/:id
POST /api/v1/reservations
PATCH /api/v1/reservations/:id/cancel
```

Tworzenie rezerwacji sprawdza:

- czy sala istnieje,
- czy sala jest aktywna,
- czy daty sa poprawne,
- czy rezerwacja nie jest w przeszlosci,
- czy `startTime < endTime`,
- czy nie ma konfliktu z aktywna rezerwacja.

Najwazniejsze bledy:

- `MOCK_USER_NOT_FOUND`
- `ROOM_NOT_FOUND`
- `ROOM_INACTIVE`
- `INVALID_DATE_FORMAT`
- `INVALID_TIME_RANGE`
- `RESERVATION_IN_PAST`
- `ROOM_ALREADY_RESERVED`
- `RESERVATION_NOT_FOUND`

## Modul admin

Modul admin zostal wydzielony do osobnego folderu:

```text
backend/src/modules/admin/
  admin.controller.js
  admin.routes.js
  admin.service.js
  admin.validation.js
```

Repository admina znajduje sie w glownym katalogu repositories:

```text
backend/src/repositories/admin.repository.js
```

Endpointy:

```text
GET /api/v1/admin/reservations
PATCH /api/v1/admin/reservations/:id/cancel
```

Modul admin pozwala:

- pobierac rezerwacje wszystkich uzytkownikow,
- filtrowac po `roomId` i `status`,
- anulowac dowolna rezerwacje.

Ograniczenie: endpointy admina nie maja jeszcze middleware autoryzacji ani sprawdzania roli administratora.

## Repositories

Warstwa dostepu do danych jest w:

```text
backend/src/repositories/
```

Pliki:

- `room.repository.js` - sale i konflikty rezerwacji dla sal.
- `reservation.repository.js` - rezerwacje zwyklego uzytkownika, tworzenie, anulowanie, konflikt, user po emailu.
- `admin.repository.js` - adminowa obsluga rezerwacji.

## Prisma

Modele w `prisma/schema.prisma`:

- `Role`
- `User`
- `Room`
- `Reservation`
- `CalendarIntegration`

Enum:

```text
ReservationStatus:
  ACTIVE
  CANCELLED
```

Seed tworzy:

- role `user` i `admin`,
- sale testowe,
- `user@example.com`,
- `admin@example.com`.

## Middlewares i errors

Zaimplementowane:

- `validate.middleware.js` - walidacja Zod dla `query`, `params`, `body`.
- `not-found.middleware.js` - `404 ROUTE_NOT_FOUND`.
- `error.middleware.js` - globalna obsluga `ApiError`, `ZodError` i bledow 500.
- `apiError.js` - wspolna klasa bledu aplikacyjnego.

Format odpowiedzi:

```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Opis bledu",
    "details": null
  }
}
```

## Testy

Testy integracyjne sa w:

```text
backend/tests/integration/
```

Pliki:

- `health.test.js`
- `rooms.test.js`
- `reservations.test.js`
- `admin.test.js`

Ostatni sprawdzony wynik:

```text
Test Files  4 passed (4)
Tests       21 passed (21)
```

## Znane ograniczenia

- Brak realnej autoryzacji.
- Reservations korzysta z mock usera.
- Admin endpoints nie sprawdzaja roli administratora.
- Integracja Google Calendar nie jest jeszcze zaimplementowana.
- `firebase.js` jest przygotowany, ale nieuzywany w flow API.
- Przy rownoleglym tworzeniu rezerwacji moze byc potrzebna transakcja albo zabezpieczenie bazodanowe.
- W czesci komunikatow sa problemy z kodowaniem polskich znakow.

