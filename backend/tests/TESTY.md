# Testy backendu

- `integration/` sprawdza endpointy HTTP i baze pgsql
- `unit/` sprawdza pojedyncze elementy infra, configi i security
- `support/integration.js` zawiera tylko wspolne przygotowanie sesji i danych rezerwacji

Przed testami integracyjnymi link do bazy w `DATABASE_URL` musi miec wykonane migracje i seed danych

```bash
npm test
```

Dokumentacja Vitest: https://vitest.dev/guide/
