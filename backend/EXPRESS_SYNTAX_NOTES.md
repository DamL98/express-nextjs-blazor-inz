# Notatki: składnia Express.js i JavaScript w backendzie

## `_req` w kontrolerach

Przykład:

```js
export async function getRoomsController(_req, res) {
  return res.status(200).json(successResponse(rooms));
}
```

`_req` to zwykła nazwa parametru. Podkreślenie nie ma specjalnego znaczenia dla JavaScriptu.

Jest to konwencja oznaczająca:

```text
Ten argument jest przekazywany przez Express, ale w tej funkcji go nie używam.
```

Express przekazuje do middleware i kontrolerów argumenty w kolejności:

```js
req, res, next
```

Dlatego kontroler może mieć postać:

```js
function controller(req, res) {}
```

albo:

```js
function controller(_req, res) {}
```

Jeżeli `req` nie jest używany, zapis `_req` jest czytelniejszy i niektóre lintery nie zgłaszają wtedy ostrzeżenia o nieużywanym parametrze.

## Destrukturyzacja obiektu

Przykład z kontrolera:

```js
const { start, end } = res.locals.validated.query;
```

To jest destrukturyzacja obiektu.

Oznacza to samo co:

```js
const start = res.locals.validated.query.start;
const end = res.locals.validated.query.end;
```

Jeżeli obiekt wygląda tak:

```js
res.locals.validated.query = {
  start: "2030-01-01T10:00:00.000Z",
  end: "2030-01-01T11:00:00.000Z",
};
```

to zapis:

```js
const { start, end } = res.locals.validated.query;
```

tworzy dwie lokalne zmienne:

```js
start; // "2030-01-01T10:00:00.000Z"
end;   // "2030-01-01T11:00:00.000Z"
```

## Skąd kontroler ma dostęp do `res`

Przykład trasy:

```js
router.get(
  "/:id/availability",
  validate(roomIdParamsSchema, "params"),
  validate(roomAvailabilityQuerySchema, "query"),
  getRoomAvailabilityController,
);
```

W tym miejscu nie wywołujemy kontrolera ręcznie.

Nie robimy:

```js
getRoomAvailabilityController();
```

Tylko przekazujemy Expressowi referencję do funkcji:

```js
getRoomAvailabilityController
```

Gdy przyjdzie request HTTP, Express sam wywoła tę funkcję mniej więcej tak:

```js
getRoomAvailabilityController(req, res, next);
```

Dlatego funkcja:

```js
export async function getRoomAvailabilityController(_req, res) {
  const { id } = res.locals.validated.params;
  const { start, end } = res.locals.validated.query;
}
```

dostaje:

- `_req` jako pierwszy argument, czyli request
- `res` jako drugi argument, czyli response

## `res.locals`

`res.locals` to obiekt udostępniany przez Expressa.

Służy do przekazywania danych między middleware w ramach jednego requestu.

Przykład data flow:

```text
Request HTTP
  -> validate(..., "params")
  -> validate(..., "query")
  -> controller
  -> response
```

Każdy middleware dostaje ten sam obiekt `res`, więc dane zapisane wcześniej w:

```js
res.locals
```

są dostępne później w kontrolerze.

## Zapis `res.locals.validated = { ...res.locals.validated, [target]: result.data }`

Kod:

```js
res.locals.validated = {
  ...res.locals.validated,
  [target]: result.data,
};
```

To nie jest destrukturyzacja.

To jest tworzenie nowego obiektu z użyciem:

- spread operatora `...`
- dynamicznej nazwy pola `[target]`

## Spread operator `...res.locals.validated`

Ten zapis:

```js
...res.locals.validated
```

kopiuje pola z istniejącego obiektu do nowego obiektu.

Przykład:

```js
const oldObject = {
  params: {
    id: "123",
  },
};

const newObject = {
  ...oldObject,
  query: {
    start: "...",
    end: "...",
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
    start: "...",
    end: "...",
  },
}
```

Bez spread operatora wcześniejsze dane mogłyby zostać nadpisane.

## Dynamiczna nazwa pola `[target]`

Przykład:

```js
const target = "query";

const obj = {
  [target]: result.data,
};
```

Jeżeli `target` ma wartość `"query"`, to powstanie:

```js
{
  query: result.data
}
```

Nawiasy kwadratowe oznaczają:

```text
Użyj wartości zmiennej jako nazwy pola obiektu.
```

Bez nawiasów:

```js
const obj = {
  target: result.data,
};
```

powstałoby pole dosłownie o nazwie `target`:

```js
{
  target: result.data
}
```

Z nawiasami:

```js
const obj = {
  [target]: result.data,
};
```

powstaje pole o nazwie zapisanej w zmiennej:

```js
{
  query: result.data
}
```

## Po co ten zapis jest potrzebny w middleware walidacji

Middleware walidacji może uruchomić się kilka razy dla jednej trasy:

```js
router.get(
  "/:id/availability",
  validate(roomIdParamsSchema, "params"),
  validate(roomAvailabilityQuerySchema, "query"),
  getRoomAvailabilityController,
);
```

Najpierw walidowane są parametry ścieżki:

```js
validate(roomIdParamsSchema, "params")
```

Wtedy `target` ma wartość:

```js
"params"
```

i zapis:

```js
res.locals.validated = {
  ...res.locals.validated,
  [target]: result.data,
};
```

tworzy:

```js
res.locals.validated = {
  params: {
    id: "uuid-sali",
  },
};
```

Potem walidowane są query params:

```js
validate(roomAvailabilityQuerySchema, "query")
```

Wtedy `target` ma wartość:

```js
"query"
```

Po drugim middleware powstaje:

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

Dzięki temu kontroler może później odczytać oba fragmenty:

```js
const { id } = res.locals.validated.params;
const { start, end } = res.locals.validated.query;
```

## Najkrótsze podsumowanie

```js
res.locals.validated = {
  ...res.locals.validated,
  [target]: result.data,
};
```

oznacza:

```text
Zachowaj wcześniejsze zwalidowane dane i dodaj nowe dane pod kluczem,
którego nazwa znajduje się w zmiennej target.
```

Praktycznie:

```js
target = "params" -> zapisuje validated.params
target = "query"  -> zapisuje validated.query
target = "body"   -> zapisałoby validated.body
```
