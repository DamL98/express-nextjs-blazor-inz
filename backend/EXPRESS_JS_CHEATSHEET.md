# Express.js i JavaScript - notatki praktyczne

## 1. `req`, `res`, `next`

W Expressie każda funkcja middleware albo kontroler dostaje od Expressa argumenty:

```js
function handler(req, res, next) {
  // ...
}
```

Express sam wywołuje tę funkcję, gdy przychodzi request HTTP.

Kolejność argumentów jest ważna:

```text
req  -> request, czyli dane od klienta
res  -> response, czyli odpowiedź do klienta
next -> funkcja przejścia do kolejnego middleware
```

Przykład:

```js
router.get("/rooms", getRoomsController);
```

Nie wywołujesz ręcznie:

```js
getRoomsController();
```

Tylko przekazujesz funkcję do Expressa. Express później robi mniej więcej:

```js
getRoomsController(req, res, next);
```

## 2. `req` - dane z requestu

`req` zawiera informacje o żądaniu HTTP.

Najczęściej używane pola:

```js
req.params;
req.query;
req.body;
req.headers;
req.cookies;
req.method;
req.originalUrl;
```

### `req.params`

Dane z dynamicznych fragmentów ścieżki.

Trasa:

```js
router.get("/rooms/:id", controller);
```

Request:

```http
GET /rooms/123
```

Wtedy:

```js
req.params = {
  id: "123",
};
```

### `req.query`

Dane z query stringa, czyli po znaku `?`.

Request:

```http
GET /rooms?active=true&capacityMin=10
```

Wtedy:

```js
req.query = {
  active: "true",
  capacityMin: "10",
};
```

Ważne: query params zwykle przychodzą jako stringi.

### `req.body`

Dane z body requestu, np. JSON wysłany przez frontend.

Żeby `req.body` działało dla JSON-a, aplikacja musi mieć:

```js
app.use(express.json());
```

Request:

```http
POST /rooms
Content-Type: application/json

{
  "name": "Sala A101",
  "capacity": 12
}
```

Wtedy:

```js
req.body = {
  name: "Sala A101",
  capacity: 12,
};
```

## 3. `res` - budowanie odpowiedzi

`res` służy do wysyłania odpowiedzi HTTP.

Najczęściej używane metody:

```js
res.status(200);
res.json(data);
res.send(data);
res.cookie("name", "value");
res.clearCookie("name");
```

Przykład:

```js
return res.status(200).json({
  success: true,
  data: rooms,
});
```

To oznacza:

```text
Ustaw status HTTP 200 i wyślij odpowiedź JSON.
```

## 4. `next` - przejście dalej

`next` to funkcja, która przekazuje request do następnego middleware albo kontrolera.

Przykład:

```js
function logger(req, res, next) {
  console.log(req.method, req.originalUrl);
  next();
}
```

Jeżeli wywołasz:

```js
next();
```

Express przechodzi dalej.

Jeżeli wywołasz:

```js
next(error);
```

Express przechodzi do error middleware.

W Express 5 błędy rzucone w funkcjach `async` są automatycznie przekazywane do error middleware:

```js
throw new ApiError(404, "ROOM_NOT_FOUND", "Sala nie istnieje.");
```

## 5. `_req`, `_res`, `_next`

Podkreślenie w nazwie parametru jest tylko konwencją.

Przykład:

```js
export async function getRoomsController(_req, res) {
  return res.status(200).json(successResponse(rooms));
}
```

`_req` oznacza:

```text
Express przekazuje mi ten argument, ale ja go tutaj nie używam.
```

JavaScript traktuje `_req` jak zwykłą nazwę zmiennej.

## 6. `res.locals` - lokalne dane dla jednego requestu

`res.locals` to obiekt udostępniany przez Expressa.

Służy do przechowywania danych tylko na czas obsługi jednego requestu.

Przykład:

```js
function middleware(req, res, next) {
  res.locals.user = {
    id: "123",
    role: "admin",
  };

  next();
}
```

Późniejszy kontroler może odczytać:

```js
function controller(req, res) {
  const user = res.locals.user;

  return res.json({
    user,
  });
}
```

Ważne:

```text
res.locals nie jest globalne.
Dane są dostępne tylko w ramach jednego requestu.
Przy kolejnym requestcie Express tworzy nowy kontekst.
```

## 7. `res.locals.validated`

`validated` nie jest wbudowane w Expressa.

Express daje:

```js
res.locals
```

Aplikacja sama tworzy:

```js
res.locals.validated
```

Przykład z middleware walidacji:

```js
res.locals.validated = {
  ...res.locals.validated,
  [target]: result.data,
};
```

To oznacza:

```text
Zachowaj wcześniejsze zwalidowane dane i dodaj nowe dane pod kluczem target.
```

Po walidacji `params` może powstać:

```js
res.locals.validated = {
  params: {
    id: "uuid-sali",
  },
};
```

Po walidacji `query` może powstać:

```js
res.locals.validated = {
  params: {
    id: "uuid-sali",
  },
  query: {
    start: "2030-01-01T10:00:00.000Z",
    end: "2030-01-01T11:00:00.000Z",
  },
};
```

Kontroler może potem użyć:

```js
const { id } = res.locals.validated.params;
const { start, end } = res.locals.validated.query;
```

## 8. Destrukturyzacja obiektów

Destrukturyzacja pozwala wyciągnąć pola z obiektu do zmiennych.

Zamiast:

```js
const start = res.locals.validated.query.start;
const end = res.locals.validated.query.end;
```

można napisać:

```js
const { start, end } = res.locals.validated.query;
```

Przykład:

```js
const room = {
  id: "123",
  name: "Sala A101",
  capacity: 12,
};

const { id, name } = room;
```

Po tym:

```js
id;   // "123"
name; // "Sala A101"
```

Można też zmienić nazwę zmiennej:

```js
const { id: roomId } = room;
```

Po tym:

```js
roomId; // "123"
```

## 9. Destrukturyzacja tablic

Destrukturyzacja tablic wyciąga wartości według pozycji.

Przykład:

```js
const numbers = [10, 20, 30];

const [first, second] = numbers;
```

Po tym:

```js
first;  // 10
second; // 20
```

Można pominąć element:

```js
const [, second] = numbers;
```

Po tym:

```js
second; // 20
```

Przykład z wynikiem z bazy:

```js
const rooms = await getRooms();
const [firstRoom] = rooms;
```

To pobiera pierwszy element tablicy.

## 10. Spread operator w obiektach

Spread operator `...` kopiuje pola z jednego obiektu do drugiego.

Przykład:

```js
const previous = {
  params: {
    id: "123",
  },
};

const next = {
  ...previous,
  query: {
    active: true,
  },
};
```

Wynik:

```js
{
  params: {
    id: "123",
  },
  query: {
    active: true,
  },
}
```

W middleware walidacji spread jest potrzebny, żeby nie usunąć danych zapisanych przez wcześniejszy middleware.

## 11. Dynamiczna nazwa pola `[target]`

Zapis:

```js
const obj = {
  [target]: result.data,
};
```

oznacza:

```text
Użyj wartości zmiennej target jako nazwy pola obiektu.
```

Przykład:

```js
const target = "query";

const obj = {
  [target]: {
    active: true,
  },
};
```

Wynik:

```js
{
  query: {
    active: true,
  },
}
```

Bez nawiasów:

```js
const obj = {
  target: {
    active: true,
  },
};
```

wynik byłby inny:

```js
{
  target: {
    active: true,
  },
}
```

Czyli:

```text
target   -> pole dosłownie o nazwie "target"
[target] -> pole o nazwie zapisanej w zmiennej target
```

## 12. Dynamiczne fragmenty ścieżki w Expressie

W Expressie dynamiczny fragment ścieżki zapisuje się przez `:`.

Przykład:

```js
router.get("/rooms/:id", controller);
```

Dla requestu:

```http
GET /rooms/abc-123
```

Express utworzy:

```js
req.params = {
  id: "abc-123",
};
```

Można mieć więcej parametrów:

```js
router.get("/users/:userId/reservations/:reservationId", controller);
```

Dla requestu:

```http
GET /users/u1/reservations/r1
```

powstanie:

```js
req.params = {
  userId: "u1",
  reservationId: "r1",
};
```

## 13. Customowe odpowiedzi API

Aplikacja używa wspólnego formatu odpowiedzi.

Sukces:

```js
export function successResponse(data) {
  return {
    success: true,
    data,
  };
}
```

Błąd:

```js
export function errorResponse(code, message, details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
```

Dzięki temu kontrolery zwracają spójny JSON.

Przykład:

```js
return res.status(200).json(successResponse(room));
```

Wynik:

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Sala A101"
  }
}
```

Błąd:

```js
return res.status(404).json(
  errorResponse("ROOM_NOT_FOUND", "Sala nie została znaleziona.")
);
```

Wynik:

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Sala nie została znaleziona.",
    "details": null
  }
}
```

## 14. `throw new` i własne błędy

`throw new` służy do rzucenia błędu.

Przykład:

```js
throw new Error("Coś poszło nie tak.");
```

W aplikacji jest własna klasa błędu:

```js
export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
```

Można rzucić błąd aplikacyjny:

```js
throw new ApiError(404, "ROOM_NOT_FOUND", "Sala nie została znaleziona.");
```

To tworzy obiekt błędu z dodatkowymi polami:

```js
{
  name: "ApiError",
  statusCode: 404,
  code: "ROOM_NOT_FOUND",
  message: "Sala nie została znaleziona.",
  details: null
}
```

## 15. Jak Express obsługuje `throw new`

W Express 5, jeśli błąd zostanie rzucony w funkcji async:

```js
export async function getRoomByIdController(_req, res) {
  const room = await getRoomById(id);
  return res.status(200).json(successResponse(room));
}
```

a wewnątrz `getRoomById` poleci:

```js
throw new ApiError(404, "ROOM_NOT_FOUND", "Sala nie została znaleziona.");
```

Express przekaże ten błąd do error middleware:

```js
export function errorMiddleware(error, _req, res, _next) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json(
      errorResponse(error.code, error.message, error.details ?? null),
    );
  }

  return res.status(500).json(
    errorResponse("INTERNAL_SERVER_ERROR", "Wystąpił nieoczekiwany błąd serwera."),
  );
}
```

Efekt:

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Sala nie została znaleziona.",
    "details": null
  }
}
```

## 16. Pełny przykład przepływu requestu

Trasa:

```js
router.get(
  "/:id/availability",
  validate(roomIdParamsSchema, "params"),
  validate(roomAvailabilityQuerySchema, "query"),
  getRoomAvailabilityController,
);
```

Request:

```http
GET /api/v1/rooms/room-123/availability?start=2030-01-01T10:00:00.000Z&end=2030-01-01T11:00:00.000Z
```

Krok 1: Express tworzy:

```js
req.params = {
  id: "room-123",
};

req.query = {
  start: "2030-01-01T10:00:00.000Z",
  end: "2030-01-01T11:00:00.000Z",
};
```

Krok 2: middleware waliduje `params` i zapisuje:

```js
res.locals.validated = {
  params: {
    id: "room-123",
  },
};
```

Krok 3: middleware waliduje `query` i dopisuje:

```js
res.locals.validated = {
  params: {
    id: "room-123",
  },
  query: {
    start: "2030-01-01T10:00:00.000Z",
    end: "2030-01-01T11:00:00.000Z",
  },
};
```

Krok 4: kontroler odczytuje dane:

```js
const { id } = res.locals.validated.params;
const { start, end } = res.locals.validated.query;
```

Krok 5: kontroler wywołuje serwis:

```js
const availability = await checkRoomAvailability(id, start, end);
```

Krok 6: kontroler zwraca customową odpowiedź:

```js
return res.status(200).json(successResponse(availability));
```

## 17. Najkrótsze podsumowanie

```text
req
  Dane przychodzące od klienta: params, query, body, headers.

res
  Obiekt odpowiedzi: status, json, send, cookies, locals.

next
  Funkcja przejścia dalej albo przekazania błędu.

res.locals
  Tymczasowy schowek danych dla jednego requestu.

destrukturyzacja
  Krótsze wyciąganie pól z obiektów albo elementów z tablic.

[target]
  Dynamiczna nazwa pola obiektu.

successResponse / errorResponse
  Wspólny format odpowiedzi API.

throw new ApiError(...)
  Rzucenie kontrolowanego błędu aplikacji, który trafi do error middleware.
```
