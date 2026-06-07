# Backend tech stack
- Node.js v22
- Express 5
  - cors
  - dotenv
  - nodemon
  - Zod
  - cookie-parser
  - jsonwebtoken
  - google apis
  - oauth
- PostgreSQL
- Prisma 7
  - prisma-erd-generator
  - mermaid cli
- Vitest

# Backend info
## Wzorzec projektowy
- Architektura Warstwowa
- Controller - Service - Repository Pattern

## Struktura folderow
- routes: deklaracja endpointow i walidacja danych
- controllers: obsługa request/response
- services: logika biznesowa np. getMyReservations, getMyReservationById itd.
- repositories: zapytania Prisma do PostgreSQL
- middleware's: walidacja, obsługa błędów
- utils: jednolite ApiResponse i ApiError

# API data-flow
HTTP request
-> Express app
-> route
-> validation middleware Zod
-> controller
-> service
-> repository
-> Prisma
-> PostgreSQL
-> Prisma
-> repository
-> service
-> controller
-> HTTP response

# Lista modułów
- Rooms - in progress
- Reservations - in progress
- Google-Services - TODO
- Admin - TODO
- OAuth - TODO


# Endpointy
## Health check
- /health
- /api/v1/rooms

## Rooms
- GET /api/v1/rooms
- GET /api/v1/rooms/:id
- GET /api/v1/rooms?active=true
- GET /api/v1/rooms?capacityMin=6
- GET /api/v1/rooms/:id/availability?start=...&end=...

## Reservations
- GET /api/v1/reservations/my
- GET /api/v1/reservations/:id
- POST /api/v1/reservations
- PATCH /api/v1/reservations/:id/cancel



# Use Case's - backend
- health check API
- sale
  - pobranie sali po :id
  - pobranie listy las
  - filtrowanie po statusie sali
  - filtrowanie po min. ilosci miejsc w sali

- sale - walidacja
  - czy sala istnieje
  - czy poprawny zakres dat
  - czy status pozwala na rezerwacje

- sale - user demo
  - pobranie swoich rezerwacji
  - pobranie swojej rezerwacji po id
  - utworzenie rezerwacji
  - anulowanie rez

- tech
  - custom global obsluga bledow: src/errors/apiError.js
  - jednolity api response: src/utils/api-response.js
  - obsluga nieistniejacych route/tras
  - walidacja danych wejsciowych PRZED controllerem przez Zod: src/modules/nazwa_modul.validation.js
  - testy endpointow z vitest src/tests/

# Baza danych
## Modele
- Room
- Reservation
- CalendarIntegration
- User
- Role

## Relacje
- Room 1:N Reservation
- User 1:N Reservation
- User 1:1 CalendarIntegration
- Role 1:N User



# Badania
## Narzędzia
- Chrome DevTools / Lighthouse / Lighthouse CLI
- Playwright - automatyczne testy w przegladarce
- k6 - testy obciążeniowe

## Co zbadać?
### Core Web Vitals
    "Standard wskaźników wydajności: pomiaru szybkości ładowania, stabilności wizualnej, interaktywności"
- FCP - kiedy pojawi się pierwszy element strony
- LCP - czas ładowania największego elementu strony
- INP - responsywność interakcji usera
- CLS - stabilność layoutu

### Rozmiar aplikacji i zasoby pobrane przez przeglądarke
  - Chrome DevTools
### Wydajność scenariusza użytkownika / E2E
  - Playwright
### Testy obciążeniowe serwera frontendu dla X userów
  - k6
### Jakość i struktura kodu
  - własna opinia

# Spis tresci
## Wstęp
## Charakterystyka technologii
  - next.js
  - blazor - Interactive Server
  - modele renderowania
  - roznice w architekturze?
## Projekt aplikacji testowej
  - krótki opis aplikacji
  - wymagania funkcjonalne
  - model danych w db
  - lista wykorzystanych endpointow do testowania
## Implementacja Next.js
  - Struktura projektu
  - Routing
  - Formularze
  - Komunikacja z API
  - Napotkane problemy?
## Implementacja Blazor
  - j.w.
## Metodyka Badań
  - Opis środowiska testowego
  - Wersje technologii
  - Narzędzia badawcze
  - Scenariusz testowy
  - Sposób zbierania wyników
  - Wyniki testów
  -
## Wyniki testów
## Wynioski