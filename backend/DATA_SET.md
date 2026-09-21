# Ogolne
- Seed musi korzystać z tej samej bazy co uruchomiony backend.
- Domyślnie odczytuje DATABASE_URL z backend/.env | chyba, ze inna zmienna jest w terminalu


# Do pomiarów wymagających dokładnej liczby rekordów ustaw dodatkowo:
- $env:MEASUREMENT_STRICT_DATASET="true"

# Komendy odpalać w
  cd backend
- $env:MEASUREMENT_USER_EMAIL="twoj-email@gmail.com"

## Komendy na dataset
- npm.cmd run prisma:seed:measurement:small
- npm.cmd run prisma:seed:measurement:medium
- npm.cmd run prisma:seed:measurement:large

## Po zmianie data-set:
- Poprzednie rezerwacje z prefiksem [MEASUREMENT] i [TEST-RUN] wskazanego użytkownika są usuwane i zastępowane nowym zestawem
- Zwykłe rezerwacje zostają, więc liczba widoczna na stronie może być większa niż w tabeli
- Nadmiarowe sale pomiarowe są usuwane tylko wtedy, gdy nie mają rezerwacji
- Daty są generowane względem dnia uruchomienia. Każda rezerwacja trwa godzinę; zestawy zawierają rezerwacje aktywne i anulowane

- Jeśli liczby nie pasują przez dodatkowe dane, seed wycofa zmiany i zgłosi błąd.

# Info o zawartosci data-set
[small] /backend/prisma/seed.measurements.small.js — lista konkretnych rezerwacji reservationDefinitions: tytuły, sale, dni, godziny i statusy
[medium] /backend/prisma/seed.measurements.medium.js — liczby w mediumDataset, godziny w timeSlots
[large] /backend/prisma/seed.measurements.large.js — liczby sal i rezerwacji; korzysta z generatora medium