# Temat pracy
- Analiza porównawcza implementacji systemu rezerwacji jako aplikacji webowej z wykorzystaniem technologii Blazor (.NET) oraz Next.js (JavaScript)

# Backend tech stack
- Node.js v24.19.0
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
- Moduły funkcjonalne
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
-> Express
-> rooms.routes.js
-> validate params
-> validate query
-> rooms.controller.js
-> rooms.service.js
-> room.repository.js
-> Prisma
-> PostgreSQL
-> response

# Lista modułów
- Rooms
- Reservations
- Google-Services - Calendar
- Auth - Google OAuth + JWT/cookie session
- Admin - TODO


# Endpointy
## Health check
- /health

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

## OAuth


# Use Case's - backend
- health check api status
- sale [rooms]
  - pobranie listy wszystkich dostępych
  - pobranie szczegółów jednej sali po id *:id*
  - filtrowanie po statusie *Active*
  - filtrowanie po pojemności *capacityMin*
  - filtrowanie po dostępności czasu *start* -> *end*

- rezerwacje [reservations]
  - pobranie swoich rezerwacji
  - pobranie szczegółow swojej jednej rezerwacji *id*
  - utworzenie jednej rezerwacji
  - anulowanie jednej rezerwacji po id
  - walidacja przy tworzeniu rezerwacji
  - utw. rezerwacji dla demo usera
    - porawnosc data start/stop
    - zakresu czasu start/stop *TODO* -> Minimum 30min. na rezerwacje
    - blokada sal anulowanych/zajetych aby nie utworzyć rezerwacji
    - Blokadu czasu rezerwacji jeśli

- OAuth
  - User może zalogować się swoim kontem Google na stronie
  - User może zsynchronizować Konto na stronie z Google Calendar
  - User może stworzyć rezerwacje, która zostanie wpisana w kalendarzu do zalogowanego konta Google użytkownika

- Lokalne login/register
  - User może zarejestrować/zalogować się danymi, które przechowywane będą zaszyfrowane w bazie danych
  - Jak połączyć to z Google Calendar? Dać mu możliwość "synchronizacji" i podpiąć GoogleId z OAuth do istniejącego lokalengo konta w DB?

# Testy api
- health check
## Rooms
- lista sal
- filtrowanie sal
- walidacja query
- pobranie sali pod ID
- 404 dla nieistniejacej sali
- dostepnosc sali
- bledny zakres czasu
## Reservations
- TODOo

# Baza danych
## Modele
- `Room` – reprezentuje salę, którą można zarezerwować
- `Reservation` – informacje o rezerwacji sali przez usera
- `User` – reprezentuje użytkownika korzystającego z systemu
- `Role` – poziom uprawnień usera User/Admin
- `CalendarIntegration` – dane potrzebne do opcjonalnej integracji konta użytkownika z Google Calendar

## Relacje
- Room 1:N Reservation
- User 1:N Reservation
- User 1:1 CalendarIntegration
- Role 1:N User

# Nastepne do wdrozenia
- lokalne register/login bez konta Googla
- dokumentacja endpointow

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
  - Playwright / Lighthouse
### Testy obciążeniowe serwera frontendu dla X userów
  - k6
