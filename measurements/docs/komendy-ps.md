# Finalna procedura pomiarowa - PowerShell

Wszystkie polecenia zakladaja uruchomienie z katalogu glownego repozytorium.

## 1. Instalacja i build

```powershell
cd backend
npm ci
npm run prisma:generate
npm test

cd ..\frontend-next
npm ci
npm run build

cd ..\frontend-blazor
dotnet restore FrontendBlazor.sln
dotnet publish FrontendBlazor/FrontendBlazor.csproj `
  -c Release `
  -o .\publish\blazor

cd ..\measurements
npm ci
npx playwright install chromium
npm run typecheck
```

Next.js pobiera sale i szczegoly sal w runtime, dlatego build nie zalezy juz od
aktualnie wybranego datasetu.

## 2. Uruchomienie aplikacji

### Dedykowana baza pomiarowa

Utworz pusta baze PostgreSQL, np. `inzynierka_measurements`, przez pgAdmin albo
narzedzie `createdb`. Ustaw jej adres jako `DATABASE_URL` w `backend/.env`, a potem:

```powershell
cd backend
npm run prisma:migrate:deploy
```

Nie uruchamiaj zwyklego `prisma:seed`, poniewaz dodaje dane demonstracyjne spoza
datasetu. Po migracji uruchom aplikacje i zaloguj raz konto pomiarowe. Dopiero wtedy
seed pomiarowy znajdzie uzytkownika.

Strict mode finalnej kampanii wymaga, aby baza nie zawierala innych sal, a konto
nie mialo zwyklych rezerwacji ani polaczenia Google Calendar.

### Procesy aplikacji

Backend, Next.js i Blazor powinny dzialac w trzech osobnych terminalach.

Backend:

```powershell
cd backend
$env:NODE_ENV="measurement"
npm start
```

Next.js:

```powershell
cd frontend-next
$env:NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
npm run start -- -p 3000
```

Blazor:

```powershell
cd frontend-blazor
$env:ASPNETCORE_ENVIRONMENT="Measurement"
cd .\publish\blazor
dotnet .\FrontendBlazor.dll `
  --urls http://localhost:5173
```

Srodowisko `Measurement` nadal uruchamia opublikowany build Release i korzysta z
pipeline niedeweloperskiego. Efemeryczne klucze ASP.NET Data Protection zapobiegaja
zaleznosci pomiaru od kluczy zapisanych w profilu Windows. Sesja aplikacji pozostaje
cookie Express API i nie korzysta z tych kluczy.

Nie nalezy uruchamiac backendu z `NODE_ENV=production` przez lokalne HTTP,
poniewaz produkcyjne cookie ma atrybut `Secure`. Profil `measurement` nie zwraca
debug details i pozwala uzywac lokalnego HTTP.

## 3. Zapis sesji

Najpierw zaloguj sie kontem wskazanym przez `MEASUREMENT_USER_EMAIL`.

Next.js:

```powershell
cd measurements
$chrome="C:\Program Files\Google\Chrome Dev\Application\chrome.exe"
& $chrome `
  --remote-debugging-port=9222 `
  --user-data-dir="$PWD\profiles\next" `
  http://localhost:3000

node scripts/save-auth-state.mjs `
  http://127.0.0.1:9222 `
  playwright/.auth/next-user.json
```

Blazor:

```powershell
& $chrome `
  --remote-debugging-port=9223 `
  --user-data-dir="$PWD\profiles\blazor" `
  http://localhost:5173

node scripts/save-auth-state.mjs `
  http://127.0.0.1:9223 `
  playwright/.auth/blazor-user.json
```

Port CDP w drugim poleceniu musi byc taki sam jak port uruchomionego Chrome.

## 4. Przygotowanie kampanii

W `backend/.env` ustaw:

```text
MEASUREMENT_USER_EMAIL=adres-konta-pomiarowego
```

Do pomiarow uzyj osobnej bazy i konta bez polaczenia z Google Calendar. Integracja
z zewnetrznym API zaburza czas write-flow.

Przed nowa, niezalezna kampania:

```powershell
cd measurements
npm run results:clean
npm run test:auth
npm run test:render-modes
npm run environment:capture -- --run-id=final-2026
```

## 5. Read-flow

Fresh context:

```powershell
npm run measure:read -- --dataset=small  --cache=fresh-context --repetitions=30 --warmups=3
npm run measure:read -- --dataset=medium --cache=fresh-context --repetitions=30 --warmups=3
npm run measure:read -- --dataset=large  --cache=fresh-context --repetitions=30 --warmups=3
```

Warm return:

```powershell
npm run measure:read -- --dataset=small  --cache=warm-return --repetitions=30 --warmups=3
npm run measure:read -- --dataset=medium --cache=warm-return --repetitions=30 --warmups=3
npm run measure:read -- --dataset=large  --cache=warm-return --repetitions=30 --warmups=3
```

## 6. Write-flow

Kontroler odtwarza dataset przed kazda probka kazdego frameworka:

```powershell
npm run measure:write -- --dataset=small  --cache=fresh-context --repetitions=30 --warmups=3
npm run measure:write -- --dataset=medium --cache=fresh-context --repetitions=30 --warmups=3
npm run measure:write -- --dataset=large  --cache=fresh-context --repetitions=30 --warmups=3
```

Write-flow wykonuj po read-flow. Nie uruchamiaj dwoch kampanii rownoczesnie.

## 7. Wyniki

Surowe rekordy:

```text
results/raw/<run-id>/<project>/*.jsonl
```

Podsumowania:

```text
results/playwright/summary-<run-id>.json
results/playwright/summary-<run-id>.csv
```

Raport zawiera mediane, srednia, minimum, maksimum, p95 i odchylenie standardowe
probki. Kontroler odrzuci raport, jezeli grupa nie ma oczekiwanej liczby probek.
