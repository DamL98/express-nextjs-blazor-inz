# Pomiary Next.js i Blazor Interactive Auto

Ten katalog zawiera powtarzalny harness do pomiaru dwoch frontendow korzystajacych
z tego samego Express API i tej samej bazy PostgreSQL.

## Najwazniejsze pliki

- `playwright.config.ts` - projekty dla trzech datasetow i dwoch stanow cache;
- `tests/read-flow.spec.ts` - niemodyfikujacy przeplyw uzytkownika;
- `tests/write-flow.spec.ts` - utworzenie i anulowanie rezerwacji;
- `scripts/run-measurements.mjs` - kontroler finalnej kampanii;
- `scripts/summarize-results.ts` - statystyki JSON i CSV;
- `docs/komendy-ps.md` - komplet polecen PowerShell;
- `docs/playwright.md` - metodyka i interpretacja wynikow.

Finalnych serii nie nalezy uruchamiac bezposrednim poleceniem Playwright z
`--repeat-each`. Kontroler kampanii odpowiada za seed, rozgrzewke, zmiane kolejnosci
frameworkow, identyfikator serii i reset danych dla write-flow.

Przyklad:

```powershell
npm run measure:read -- `
  --dataset=small `
  --cache=fresh-context `
  --repetitions=30 `
  --warmups=3
```

Szczegolowa procedura znajduje sie w `docs/komendy-ps.md`.
