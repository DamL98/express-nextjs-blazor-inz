# Podsumowanie frontendu

Frontend znajduje sie w katalogu `frontend-next` i jest rozwijany na branchu `feature/frontend-nextjs-core`.

## Stack

- Next.js `16.2.9`.
- React `19.2.4`.
- TypeScript.
- Tailwind CSS 4.
- ESLint 9.
- App Router.

## Struktura

```text
frontend-next/
  app/
    admin/
      page.tsx
    reservations/
      page.tsx
    rooms/
      page.tsx
      [id]/
        page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    reservations/
      ReservationForm.tsx
  lib/
    api.ts
    types.ts
```

## Skrypty

```text
npm run dev
npm run build
npm start
npm run lint
```

## Konfiguracja API

Frontend korzysta ze zmiennej:

```text
NEXT_PUBLIC_API_URL
```

Powinna wskazywac backend z prefiksem API, np.:

```text
http://localhost:4000/api/v1
```

Klient API znajduje sie w:

```text
frontend-next/lib/api.ts
```

Aktualnie zaimplementowane funkcje:

- `getRooms(filters)`
- `getRoomById(id)`
- `createReservation(payload)`

Brakuje jeszcze funkcji dla:

- listy rezerwacji uzytkownika,
- anulowania rezerwacji,
- endpointow admina,
- sprawdzania dostepnosci sali.

## Typy

Typy domenowe sa w:

```text
frontend-next/lib/types.ts
```

Zdefiniowano:

- `ApiSuccess<T>`
- `ApiErrorResponse`
- `ApiResponse<T>`
- `Room`
- `ReservationStatus`
- `Reservation`
- `CreateReservationPayload`
- `CreateReservationResult`

## Widok glowny

`app/page.tsx` nadal jest domyslna strona z `create-next-app`.

Do zrobienia:

- usunac domyslny content Next.js,
- przygotowac strone startowa systemu rezerwacji,
- dodac linki do sal, rezerwacji i admina.

## Layout

`app/layout.tsx` jest nadal bazowy.

Aktualny stan:

- fonty `Geist` i `Geist_Mono`,
- import `globals.css`,
- domyslne metadata z `create-next-app`,
- `html lang="en"`.

Do zrobienia:

- zmienic metadata na nazwe projektu,
- ustawic `lang="pl"`,
- dodac wspolna nawigacje/layout aplikacyjny.

## Widok sal

`app/rooms/page.tsx` jest czesciowo zaimplementowany.

Funkcje:

- pobiera sale z backendu przez `getRooms()`,
- renderuje liste sal,
- pokazuje nazwe, lokalizacje, liczbe miejsc i status,
- linkuje do szczegolow sali.

Braki:

- brak loading/error state,
- brak filtrow po `active` i `capacityMin`,
- brak pustego stanu,
- problemy z kodowaniem polskich znakow.

## Widok szczegolow sali

`app/rooms/[id]/page.tsx` jest czesciowo zaimplementowany.

Funkcje:

- pobiera sale po id przez `getRoomById(id)`,
- pokazuje szczegoly sali,
- dla aktywnej sali renderuje formularz rezerwacji,
- dla nieaktywnej sali pokazuje komunikat.

Braki:

- brak obslugi `ROOM_NOT_FOUND`,
- brak loading/error state,
- brak integracji ze sprawdzaniem dostepnosci sali,
- problemy z kodowaniem polskich znakow.

## Formularz rezerwacji

Komponent:

```text
components/reservations/ReservationForm.tsx
```

Status: podstawowo zaimplementowany.

Funkcje:

- komponent kliencki,
- pola `title`, `description`, `startTime`, `endTime`,
- wysyla `POST /reservations` przez `createReservation`,
- pokazuje komunikat sukcesu,
- pokazuje komunikat bledu,
- resetuje formularz po sukcesie.

Braki:

- brak walidacji frontowej poza `required`,
- brak blokady dat z przeszlosci,
- brak blokady `startTime >= endTime`,
- brak sprawdzania dostepnosci sali przed utworzeniem rezerwacji.

## Widok rezerwacji

`app/reservations/page.tsx` jest pusty.

Planowany zakres:

- lista rezerwacji mock usera,
- pobieranie z `GET /api/v1/reservations/my`,
- anulowanie przez `PATCH /api/v1/reservations/:id/cancel`,
- filtrowanie po statusie albo sali.

## Widok admina

`app/admin/page.tsx` jest pusty.

Backend ma juz:

```text
GET /api/v1/admin/reservations
PATCH /api/v1/admin/reservations/:id/cancel
```

Po stronie frontendu brakuje:

- klienta API dla admin endpoints,
- widoku listy rezerwacji wszystkich uzytkownikow,
- akcji anulowania,
- filtrow `roomId` i `status`,
- loading/error state.

## Testy

Aktualnie nie ma testow frontendu.

Brakuje testow dla:

- `ReservationForm`,
- `lib/api.ts`,
- listy sal,
- szczegolow sali,
- przyszlych widokow rezerwacji i admina.

## Znane problemy

- Strona glowna jest nadal defaultowa z Next.js.
- Metadata sa nadal defaultowe.
- `html lang` jest ustawione na `en`.
- `app/admin/page.tsx` jest pusty.
- `app/reservations/page.tsx` jest pusty.
- Brakuje globalnej nawigacji.
- Brakuje loading/error boundaries.
- W UI sa problemy z kodowaniem polskich znakow.
- W `lib/api.ts` jest literowka w komunikacie bledu: `NEXT_PUBLIC_API_UR` zamiast `NEXT_PUBLIC_API_URL`.
- Brak testow frontendu.

## Ogolny etap

Frontend jest na etapie podstawowego szkieletu Next.js z pierwsza integracja z backendem.

Najbardziej zaawansowany obszar:

- lista sal,
- szczegoly sali,
- formularz tworzenia rezerwacji.

Najwieksze braki do MVP:

- strona glowna aplikacji,
- widok rezerwacji,
- panel admina,
- poprawa kodowania polskich znakow,
- nawigacja,
- loading/error state,
- testy frontendu.

