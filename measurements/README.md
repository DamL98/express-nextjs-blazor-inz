# Pomiary Next.js i Blazor WebAssembly

Playwright wykonuje te same scenariusze E2E dla obu frontendów. Baza danych, API
i produkcyjne wersje frontendów muszą być uruchomione przed rozpoczęciem pomiaru.
Metoda badawcza jest opisana w [PROTOCOL.md](PROTOCOL.md).

## Struktura

- `measurement-config.ts` — datasety, adresy aplikacji i warianty eksperymentu;
- `playwright.config.ts` — konfiguracja Chromium i projektów Playwright;
- `tests/` — scenariusze użytkownika;
- `scripts/run-measurements.ts` — preflight i wykonanie jednej serii;
- `scripts/summarize-results.ts` — raport JSON, CSV i SVG;
- `scripts/statistics.ts` — walidacja wyników i statystyki.

## Jednorazowa instalacja

```powershell
cd measurements
npm ci
npx playwright install chromium
npm run typecheck
npm run test:unit
```

## Ręczne przygotowanie środowiska

Przed pomiarem samodzielnie:

1. uruchamic osobną bazę `inz_measurements` na porcie 5434;
2. wykonuje migracje;
3. uruchamic Express API w trybie produkcyjnym na porcie 4100;
4. uruchamic produkcyjny Next.js na porcie 3100;
5. uruchamic Blazor w środowisku `Measurement` na porcie 5177;
6. zalogować konto pomiarowe i załadować wybrany dataset low/med/high

Bazę z tego repozytorium można uruchomić ręcznie poleceniem:

```powershell
cd measurements
docker compose up -d --wait
```

API musi mieć ustawione:

```text
NODE_ENV=production
PORT=4100
DATABASE_URL=postgresql://measurement:local-measurement-only@localhost:5434/inz_measurements
DIRECT_URL=postgresql://measurement:local-measurement-only@localhost:5434/inz_measurements
FRONTEND_NEXT_URL=http://localhost:3100
FRONTEND_BLAZOR_URL=http://localhost:5177
MEASUREMENT_DATABASE_ONLY=true
RATE_LIMIT_ENABLED=false
```

Next.js musi zostać zbudowany z:

```text
NEXT_PUBLIC_API_URL=http://localhost:4100/api/v1
MEASUREMENT_DATABASE_ONLY=true
NODE_ENV=production
```

Blazor należy opublikować w konfiguracji Release i uruchomić z
`ASPNETCORE_ENVIRONMENT=Measurement`.

## Sesja Playwright

Testy używają jednego pliku sesji dla obu frontendów. Po uruchomieniu aplikacji
utwórz go przez logowanie Google:

```powershell
cd measurements
New-Item -ItemType Directory -Force playwright/.auth
npx playwright codegen --save-storage=playwright/.auth/user.json http://localhost:3100/login
```

W otwartym oknie zaloguj konto pomiarowe, poczekaj na dashboard i zamknij
przeglądarkę. Plik `user.json` jest ignorowany przez Git.

## Dataset

Dataset jest ładowany ręcznie przed serią. Przykład dla wariantu `small`:

```powershell
cd backend
$env:DATABASE_URL="postgresql://measurement:local-measurement-only@localhost:5434/inz_measurements"
$env:MEASUREMENT_USER_EMAIL="adres-konta-pomiarowego"
$env:MEASUREMENT_STRICT_DATASET="true"
npm run prisma:seed:measurement:small
```

Analogicznie dostępne są skrypty `medium` i `large`. Runner przed pomiarem
porównuje liczbę sal i rezerwacji z wybranym wariantem. Dla scenariusza zapisu
automatycznie wykonuje ten sam seed przed każdą próbą, ponieważ test tworzy nową
rezerwację.

## Uruchomienie pomiaru

Najpierw sprawdź sesję i oba frontendy:

```powershell
cd measurements
npm test
```

Następnie uruchom wybraną serię:

```powershell
npm run measure:read -- --dataset=small --cache=fresh-context --repetitions=5 --warmups=2
npm run measure:write -- --dataset=small --cache=fresh-context --repetitions=5 --warmups=2
```

Dostępne wartości `--cache` to `fresh-context` i `warm-return`. Dla właściwej
kampanii należy wykonać osobne serie dla każdego datasetu, scenariusza i trybu
cache. Wyniki trafiają do `results/raw/<run-id>`.

Raport jest tworzony automatycznie po pomiarze. Można wygenerować go ponownie
albo usunąć wszystkie wyniki poleceniami:

```powershell
npm run results:summarize -- --run-id=<run-id>
npm run results:clean
```

Runner nie uruchamia ani nie zatrzymuje aplikacji. Odrzuci pomiar, jeżeli wykryje
nieprodukcyjny frontend, inny renderer Blazor, niewłaściwą bazę, wygasłą sesję lub
dataset o błędnym rozmiarze.
