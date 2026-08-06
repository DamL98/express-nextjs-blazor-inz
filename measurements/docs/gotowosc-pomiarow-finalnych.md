# Przygotowanie projektu do finalnych pomiarow

Data weryfikacji: 6 sierpnia 2026 r.

## Usuniete zagrozenia metodologiczne

| Problem | Rozwiazanie |
| --- | --- |
| Nieistniejace projekty `next-cold` i `blazor-cold` | Skrypty wskazuja istniejace projekty Playwright. |
| Brak datasetu medium | Dodano projekty small, medium i large dla obu frameworkow. |
| Laczenie wynikow roznych datasetow | Kazdy rekord i grupa raportu zawiera `dataset` oraz `runId`. |
| Nieprecyzyjne okreslenie cold | Zastapiono je nazwami `fresh-context` i `warm-return`. |
| Brak kontroli Interactive Auto | Zapisywany jest `RendererInfo.Name`; test wymaga Server dla fresh i WebAssembly dla warm. |
| Timeout 5 s dla large | Timeout asercji wynosi 20 s, nawigacji 60 s, testu 120 s. Czas pomiaru nie jest przez to sztucznie skrocony. |
| Next `/rooms` pobieral dane podczas builda | Lista i szczegoly sal pobieraja Express API w runtime, tak jak Blazor. |
| Seed large pozostawial sale po przejsciu na small | Small usuwa nieuzywane sale `Sala Pomiarowa ...`. |
| Write-flow zwiekszal baze po kazdej probce | Kontroler uruchamia seed przed kazda probka kazdego frameworka. |
| Stare wyniki byly dopisywane do tych samych plikow | Wyniki sa rozdzielone katalogiem `runId`, a duplikaty probek sa odrzucane. |
| Brak rownowazenia kolejnosci | Kolejnosc Next/Blazor zmienia sie co probke. |
| Brak statystyk ogonowych | Raport zawiera p95 i odchylenie standardowe probki. |
| Brak opisu srodowiska | Skrypt zapisuje wersje runtime, Chromium, system, sprzet i commit Git. |
| Stare klucze ASP.NET Data Protection blokowaly Release | Profil `Measurement` uzywa efemerycznych kluczy tylko dla procesu pomiarowego. |

## Instrumentacja

Oba frontendy wystawiaja niewidoczne atrybuty:

- `data-measurement-page` - identyfikator strony;
- `data-measurement-state` - `loading`, `ready` albo `error`;
- `data-measurement-count` - liczba sal lub rezerwacji;
- Blazor: `data-measurement-renderer` i `data-measurement-interactive`.

Atrybuty nie zmieniaja ukladu strony. Playwright konczy pomiar po stanie `ready`,
czyli po odpowiedzi API i aktualizacji komponentu.

## Wyniki kontroli technicznej

- backend: 48 z 48 testow;
- Next.js: ESLint i produkcyjny build zakonczone powodzeniem;
- Blazor: Release build i publish zakonczone powodzeniem, 0 ostrzezen i 0 bledow;
- measurements: TypeScript strict oraz lista projektow Playwright poprawne;
- auth-check: Next i Blazor zakonczone powodzeniem;
- renderer-check: fresh = Server, warm-return = WebAssembly;
- seedy: zweryfikowano small, medium, large oraz przejscia large -> small i medium -> small;
- opis srodowiska: poprawnie zapisane Node, npm, .NET i Chromium.

## Warunek przed finalna kampania

Lokalna baza uzyta podczas weryfikacji zawierala dodatkowe dane demonstracyjne.
Strict mode prawidlowo odrzucil stan 16 sal i 16 rezerwacji konta przy oczekiwanym
small 10/15. Finalne wyniki wymagaja pustej, dedykowanej bazy po migracjach i
dedykowanego konta bez integracji Google Calendar.

Nie jest to brak funkcji harnessu. Jest to kontrola chroniaca przed zapisaniem
wynikow z nieprawidlowo opisanym rozmiarem danych.
