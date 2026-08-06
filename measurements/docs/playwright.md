# Metodyka Playwright

## Cel

Pomiar obejmuje czas od rozpoczecia akcji uzytkownika do wyrenderowania danych z
Express API. Oba frontendy korzystaja z runtime fetch, tej samej bazy, tego samego
uzytkownika, rozdzielczosci 1366x768 i jednego workera.

## Datasety

| Dataset | Sale | Rezerwacje uzytkownika |
| --- | ---: | ---: |
| small | 10 | 15 |
| medium | 50 | 200 |
| large | 100 | 400 |

Test sprawdza `data-measurement-count`. Seria zakonczy sie bledem, jezeli aktywny
seed nie odpowiada projektowi Playwright. Zapobiega to pomiarowi large pod etykieta
small.

Kontroler ustawia dodatkowo `MEASUREMENT_STRICT_DATASET=true`. Seed wycofa
transakcje, jezeli globalna liczba sal albo liczba rezerwacji konta pomiarowego nie
odpowiada datasetowi. Reczne uruchomienie seeda bez tej zmiennej nadal zachowuje
zwykle dane.

## Punkty koncowe pomiaru

Frontend ustawia `data-measurement-state="ready"` dopiero po zakonczeniu requestu i
aktualizacji stanu komponentu. Pomiar nie konczy sie na `DOMContentLoaded` ani na
samym pojawieniu sie naglowka.

Read-flow mierzy:

1. `dashboard-ready`;
2. `rooms-list-ready`;
3. `room-details-ready`;
4. `reservations-list-ready`.

Write-flow mierzy:

1. `create-reservation`;
2. `new-reservation-visible`;
3. `cancel-reservation`.

## Stany cache

`fresh-context` oznacza nowy BrowserContext bez cache HTTP. Procesy backendu i
frontendow pozostaja uruchomione i rozgrzane. Nie jest to cold process.

`warm-return` najpierw przechodzi caly flow w tym samym BrowserContext, a dopiero
potem rozpoczyna pomiar. Dla Blazor Interactive Auto test wymaga aktywnego renderera
WebAssembly. Faktyczna wartosc `RendererInfo.Name` jest zapisywana przy kazdym
kroku. Seria jest przerywana, jezeli Blazor nie przejdzie do WebAssembly.

## Kolejnosc i rozgrzewka

Kontroler wykonuje trzy domyslne proby rozgrzewkowe bez zapisu. Wlasciwe probki sa
uruchamiane naprzemiennie:

```text
Nastepna probka parzysta: Next -> Blazor
Nastepna probka nieparzysta: Blazor -> Next
```

Ogranicza to wplyw temperatury, procesow tla i dryfu czasowego na jeden framework.

## Write-flow

Seed jest uruchamiany przed kazda probka kazdego frameworka. Oba frontendy zawsze
zaczynaja z ta sama liczba rekordow, a anulowane wpisy `[TEST-RUN]` sa usuwane.
Konto pomiarowe nie moze miec integracji Google Calendar.

## Statystyki

Dla kazdej kombinacji `runId`, datasetu, frameworka, cache mode, runtime i kroku
wyliczane sa:

- liczba probek;
- mediana;
- srednia arytmetyczna;
- minimum i maksimum;
- 95. percentyl metoda nearest-rank;
- odchylenie standardowe probki z mianownikiem `n - 1`.

Nie nalezy usuwac obserwacji odstajacych bez zdefiniowanej przed pomiarem reguly.
Nieudana probka powinna uniewaznic serie albo zostac jawnie opisana i powtorzona z
nowym `runId`.

## Warunki srodowiska

- buildy produkcyjne Next.js i Blazor Release;
- jeden komputer i jedna wersja Chromium;
- zasilanie sieciowe oraz staly profil energetyczny;
- zamkniete DevTools i aplikacje obciazajace system;
- brak rownoleglych kampanii;
- zapis commita Git i srodowiska przez `npm run environment:capture`;
- osobna baza pomiarowa bez zwyklych sal i rezerwacji.
