# Protokół pomiarowy, wersja 2

## Pytanie badawcze

Porównujemy czas gotowości danych interfejsu i wykonania operacji w dwóch implementacjach tej samej aplikacji: Next.js App Router z klientowym fetch oraz Blazor Interactive WebAssembly bez prerenderowania. Nie porównujemy wszystkich możliwości frameworków, SSR, Auto ani skalowalności wieloużytkownikowej.

## Kontrolowane warunki

- Wspólny Express API i PostgreSQL, osobna baza `inz_measurements` na porcie 5434.
- To samo dedykowane konto pomiarowe w obu frontendach. Operator loguje je przed kampanią, a Playwright korzysta z zapisanego stanu sesji. Adres konta jest zapisywany w manifeście.
- Konto bez Google Calendar. Samo logowanie OAuth i zewnętrzna synchronizacja nie należą do mierzonego czasu.
- Operator uruchamia produkcyjny Next build/start, Blazor publish Release (domyślne ustawienia WASM, bez wymuszonego AOT) oraz backend z `NODE_ENV=production`. Preflight odrzuca inne środowisko.
- Chromium dostarczony przez przypięty lockfile Playwright, viewport 1366x768, pl-PL, Europe/Warsaw, jeden worker, zero retries, trace/video wyłączone.
- Brak cache danych API (`no-store`), brak automatycznego prefetch Next Link. Cache statycznych zasobów pozostaje aktywny.
- Profil podstawowy: localhost bez throttlingu, serwery uruchomione przed serią i rozgrzane. Nie jest to zimny start serwera ani symulacja Internetu.
- Ten sam komputer; podczas kampanii bez buildów, aktualizacji, debuggerów i innych obciążeń. Manifest zapisuje sprzęt i wersje; operator odpowiada za stabilne zasilanie i obciążenie systemu.

## Warianty

Datasety: 10/50/100 sal i 15/200/400 rezerwacji użytkownika. Brak paginacji jest celowy: badamy wpływ wielkości całej listy w tym zakresie, nie ogólną skalowalność API.

`fresh-context`: każdy test ma nowy kontekst przeglądarki z sesją, bez wcześniejszych zasobów aplikacji. Backend/baza pozostają rozgrzane.

`warm-return`: przed testem odwiedzane są dashboard, sale, rezerwacje; czekamy także na status panelu kalendarza, następnie about:blank i właściwe wejście w tym samym kontekście. Cache nie zmienia renderera: zawsze WASM.

Testy dashboard-direct, rooms-direct, reservations-direct są osobnymi testami i mają osobne konteksty. room-details-navigation zawsze zaczyna od gotowej listy sal i mierzy kliknięcie linku. Nie jest zimnym startem aplikacji. Scenariusz zapisu także startuje z gotowego formularza; etykieta fresh opisuje kontekst na początku przygotowania, nie zimny zapis.

## Metryki

Główna metryka to czas ścienny obserwowany przez runner Playwright (`performance.now`): rozpoczęcie nawigacji lub akcji → potwierdzenie widocznego znacznika ready/rezultatu. Obejmuje narzut automatyzacji i polling asercji. Nie jest czasem samego renderowania ani API.

- direct: goto z domcontentloaded → widoczny korzeń strony i ready;
- room-details-navigation: kliknięcie → ready szczegółów;
- create-reservation: kliknięcie zatwierdzenia już wypełnionego formularza → komunikat sukcesu;
- new-reservation-visible: goto listy → ready i widoczny konkretny tytuł;
- cancel-reservation: kliknięcie anulowania, automatyczna akceptacja dialogu → status Anulowana konkretnej karty. Obejmuje narzut dialogu, nie czas zastanawiania się użytkownika.

Ready listy rezerwacji dotyczy listy, nie panelu kalendarza. Panel musi zakończyć ładowanie przed dalszym krokiem. Zgodność liczebności i renderera weryfikowana jest poza stoperem, ale ich błąd unieważnia cały test.

## Procedura i analiza

Najpierw typecheck/testy jednostkowe i funkcjonalne, potem pilotaż 5 prób na wariant. Pilot służy ocenie błędów i rozrzutu. Docelowo punkt wyjścia 30 prób i 3 rozgrzewki, z możliwością zwiększenia liczby na podstawie pilotażu. Zmiana kodu lub konfiguracji wymaga ponownego pilotażu i nowej kampanii.

Operator ręcznie uruchamia aplikacje i ładuje dataset przed każdą serią. Preflight sprawdza tryb produkcyjny, renderer, izolowaną bazę, sesję oraz liczebność danych. Dla scenariusza zapisu runner ponawia seed przed każdą próbą.

Kolejność frameworków naprzemienna AB/BA. Dataset resetowany przed każdą próbą zapisu, również rozgrzewkową. Seed nie należy do czasu pomiaru. Błędy przerywają serię, pozostają w archiwum; brak automatycznego zastępowania nieudanej próby. Dane testu zapisywane dopiero po jego zakończeniu wraz ze statusem. Walidator wymaga pełnej macierzy obu frameworków, każdego kroku i indeksu.

Raport: średnia, mediana, min/max, odchylenie standardowe próby i p95 nearest-rank; p95 przy małym n ma ograniczoną stabilność. Porównanie par o tym samym indeksie: mediana różnic Next minus Blazor i 95% percentylowy bootstrap (10 000 losowań, stałe ziarno). Ujemna różnica sprzyja Next. Nie utożsamiać mediany różnic z różnicą median. Nie usuwać obserwacji odstających po obejrzeniu wyniku.

Archiwum zawiera manifest, wersję przeglądarki w próbach, pełne próby ze statusem, raport JSON/CSV i SVG median. Zachować także kod/commit, lockfile i konfigurację maszyny. Wnioski ograniczyć do pojedynczego użytkownika, podanych datasetów i profilu localhost. Pomiary transferu/API, znaczniki przeglądarkowe, profil sieci oraz Blazor Auto są rozszerzeniami; nie należy twierdzić, że zostały zmierzone przez te metryki.
