# Ikony interfejsu Next.js i Blazor

## Cel

Oba frontendy powinny wyświetlać te same ikony, w tych samych miejscach i z tymi
samymi parametrami. Dzięki temu ikony poprawią czytelność interfejsu, ale nie
wprowadzą niekontrolowanej różnicy między aplikacjami porównywanymi w projekcie
`measurements`.

Ikony należy przechowywać lokalnie. Aplikacje nie powinny pobierać ich z CDN ani
z zewnętrznego API. Folder `icons` w katalogu głównym zawiera dokumentację, ale
nie jest źródłem zasobów używanym podczas działania aplikacji. Każdy frontend
otrzymuje własną kopię tego samego pliku SVG.

## Wybrane źródło

Proponowany zestaw to [Lucide](https://lucide.dev/). Ikony są dostępne jako SVG
i objęte licencją ISC. Przed wdrożeniem należy wybrać konkretną wersję Lucide,
zapisać jej numer w tym dokumencie i nie aktualizować ikon w trakcie jednej
kampanii pomiarowej.

Nie należy instalować pełnego zestawu ikon w aplikacjach. Do wspólnego sprite'a
trafiają tylko symbole rzeczywiście używane w interfejsie. Lucide nie zawiera
logotypów firm, dlatego logo Google trzeba pobrać z oficjalnych materiałów
Google i przechowywać jako osobny lokalny plik SVG.

Wersja użyta w projekcie: `do uzupełnienia podczas wdrożenia`.

## Proponowane ikony

### Podstawowy zestaw

| Miejsce | Element | Ikona Lucide | ID w SVG | Rozmiar |
|---|---|---|---|---:|
| Sidebar | Dashboard | `LayoutDashboard` | `layout-dashboard` | 20 px |
| Sidebar | Sale | `Building2` | `building-2` | 20 px |
| Sidebar | Rezerwacje | `CalendarDays` | `calendar-days` | 20 px |
| Topbar | Wyloguj | `LogOut` | `log-out` | 18 px |
| Rezerwacje | Zarezerwuj salę | `CalendarPlus` | `calendar-plus` | 18 px |
| Lista sal | Zobacz szczegóły | `ArrowRight` | `arrow-right` | 16 px |
| Szczegóły sali | Wróć do listy | `ArrowLeft` | `arrow-left` | 16 px |
| Rezerwacja | Anuluj rezerwację | `CalendarX` | `calendar-x` | 18 px |
| Komunikat sukcesu | Operacja zakończona | `CircleCheck` | `circle-check` | 20 px |
| Komunikat błędu | Błąd operacji | `CircleAlert` | `circle-alert` | 20 px |

Ten zestaw powinien zostać wdrożony jako pierwszy. Obejmuje główną nawigację,
najważniejsze akcje i komunikaty.

### Informacje o salach

| Element | Ikona Lucide | ID w SVG | Zastosowanie |
|---|---|---|---|
| Lokalizacja | `MapPin` | `map-pin` | obok lokalizacji sali |
| Liczba miejsc | `Users` | `users` | obok pojemności sali |
| Sala aktywna | `CircleCheck` | `circle-check` | status aktywnej sali |
| Sala nieaktywna | `CircleOff` | `circle-off` | status niedostępnej sali |
| Brak sal | `Building2` | `building-2` | pusty stan listy |
| Opis sali | `AlignLeft` | `align-left` | opcjonalnie przy opisie |

Na kartach sal wystarczą ikony `map-pin` i `users`. Dodawanie ikony do każdego
wiersza tekstu utrudni skanowanie zawartości.

### Rezerwacje

| Element | Ikona Lucide | ID w SVG |
|---|---|---|
| Lista rezerwacji | `CalendarDays` | `calendar-days` |
| Nowa rezerwacja | `CalendarPlus` | `calendar-plus` |
| Termin rezerwacji | `CalendarClock` | `calendar-clock` |
| Aktywna rezerwacja | `CircleCheck` | `circle-check` |
| Anulowana rezerwacja | `CircleX` | `circle-x` |
| Anulowanie rezerwacji | `CalendarX` | `calendar-x` |
| Brak rezerwacji | `CalendarOff` | `calendar-off` |
| Przejście do rezerwacji | `ArrowRight` | `arrow-right` |

Ikona statusu powinna występować razem z tekstem `Aktywna` albo `Anulowana`.
Kolor nie może być jedynym sposobem przekazania statusu.

### Formularz rezerwacji

| Pole lub akcja | Ikona Lucide | ID w SVG |
|---|---|---|
| Nagłówek formularza | `CalendarPlus` | `calendar-plus` |
| Nazwa rezerwacji | `Tag` | `tag` |
| Opis | `AlignLeft` | `align-left` |
| Początek | `CalendarClock` | `calendar-clock` |
| Koniec | `Clock` | `clock` |
| Utwórz rezerwację | `CalendarPlus` | `calendar-plus` |
| Błąd walidacji | `CircleAlert` | `circle-alert` |
| Rezerwacja utworzona | `CircleCheck` | `circle-check` |

Ikony przy polach formularza są opcjonalne. Etykiety tekstowe już wyjaśniają
znaczenie pól, dlatego najpierw należy dodać ikonę nagłówka, przycisku i
komunikatów.

### Google Calendar

| Stan lub akcja | Ikona Lucide | ID w SVG |
|---|---|---|
| Nagłówek integracji | `CalendarSync` | `calendar-sync` |
| Połącz konto | `Link2` | `link-2` |
| Odłącz konto | `Unlink` | `unlink` |
| Konto połączone | `BadgeCheck` | `badge-check` |
| Błąd integracji | `CircleAlert` | `circle-alert` |
| Trwa synchronizacja | `RefreshCw` | `refresh-cw` |

Ikona `refresh-cw` nie powinna obracać się stale. Animację można uruchamiać
tylko podczas rzeczywistej operacji i trzeba zastosować ją identycznie w obu
frontendach.

### Logowanie

| Element | Ikona | ID lub plik |
|---|---|---|
| Zaloguj lokalnie | `LogIn` | `log-in` |
| Adres e-mail | `Mail` | `mail` |
| Hasło | `LockKeyhole` | `lock-keyhole` |
| Zaloguj przez Google | oficjalne logo Google | `google.svg` |

Logo Google musi być tym samym plikiem w obu aplikacjach. Nie należy zastępować
go podobną ikoną z innej biblioteki.

### Stany systemowe

| Stan | Ikona Lucide | ID w SVG |
|---|---|---|
| Ładowanie | `LoaderCircle` | `loader-circle` |
| Błąd | `CircleAlert` | `circle-alert` |
| Ostrzeżenie | `TriangleAlert` | `triangle-alert` |
| Sukces | `CircleCheck` | `circle-check` |
| Brak połączenia | `WifiOff` | `wifi-off` |
| Ponów połączenie | `RefreshCw` | `refresh-cw` |
| Nie znaleziono strony | `FileQuestion` | `file-question` |

## Minimalny zestaw do pierwszego wdrożenia

Pierwsza wersja sprite'a może zawierać tylko poniższe symbole:

```text
layout-dashboard
building-2
calendar-days
calendar-plus
calendar-x
calendar-clock
calendar-off
log-out
arrow-left
arrow-right
map-pin
users
circle-check
circle-x
circle-alert
calendar-sync
```

Rozszerzanie zestawu należy wykonywać dopiero wtedy, gdy nowa ikona zostanie
wykorzystana w obu frontendach.

## Struktura plików

Docelowa struktura powinna wyglądać następująco:

```text
icons/
└── README.md

frontend-next/
├── public/
│   └── icons/
│       ├── ui-icons.svg
│       └── google.svg
└── components/
    └── ui/
        └── AppIcon.tsx

frontend-blazor/
├── FrontendBlazor/
│   └── wwwroot/
│       └── icons/
│           ├── ui-icons.svg
│           └── google.svg
└── FrontendBlazor.Client/
    └── Components/
        └── Ui/
            └── AppIcon.razor
```

Pliki `ui-icons.svg` i `google.svg` muszą mieć identyczną zawartość w obu
projektach. Nie należy importować ich w czasie budowania z folderu nadrzędnego.
Obie aplikacje mają pozostać samodzielne.

## Przygotowanie sprite'a SVG

1. Wybrać i zapisać wersję Lucide.
2. Pobrać źródłowe pliki SVG tylko dla zatwierdzonych ikon.
3. Skopiować elementy graficzne każdej ikony do osobnego elementu `symbol`.
4. Ustawić identyczny `viewBox="0 0 24 24"` dla wszystkich symboli Lucide.
5. Zachować `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`,
   `stroke-linecap="round"` i `stroke-linejoin="round"`.
6. Nadać symbolom identyfikatory z kolumny `ID w SVG`.
7. Umieścić tylko wykorzystywane symbole w `ui-icons.svg`.
8. Skopiować gotowy plik do obu frontendów.
9. Zachować informację o wersji i licencji Lucide w repozytorium.

Przykładowa struktura pliku:

```svg
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol
    id="layout-dashboard"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- Oryginalne elementy path lub rect z wybranej wersji Lucide. -->
  </symbol>

  <symbol
    id="building-2"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- Oryginalne elementy ikony. -->
  </symbol>
</svg>
```

Nie należy ręcznie modyfikować geometrii tylko w jednej kopii. Zmiana ścieżki,
grubości linii albo `viewBox` wymaga ponownego skopiowania sprite'a do obu
frontendów.

## Komponent Next.js

Plik `frontend-next/components/ui/AppIcon.tsx` powinien ograniczać dostępne
nazwy do ikon znajdujących się w sprite'cie:

```tsx
export type IconName =
  | "layout-dashboard"
  | "building-2"
  | "calendar-days"
  | "calendar-plus"
  | "calendar-x"
  | "calendar-clock"
  | "calendar-off"
  | "log-out"
  | "arrow-left"
  | "arrow-right"
  | "map-pin"
  | "users"
  | "circle-check"
  | "circle-x"
  | "circle-alert"
  | "calendar-sync";

type AppIconProps = {
  name: IconName;
  className?: string;
};

export function AppIcon({ name, className = "size-5" }: AppIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
    >
      <use href={`/icons/ui-icons.svg#${name}`} />
    </svg>
  );
}
```

Przykład użycia w linku:

```tsx
<Link
  prefetch={false}
  href="/rooms"
  className="flex items-center gap-2 rounded-lg px-3 py-2"
>
  <AppIcon name="building-2" />
  <span>Sale</span>
</Link>
```

Ikona dziedziczy kolor przez `currentColor`, więc aktywny link zmienia kolor
tekstu i ikony za pomocą tych samych klas Tailwind.

## Komponent Blazor

Plik `frontend-blazor/FrontendBlazor.Client/Components/Ui/AppIcon.razor`:

```razor
<svg
    aria-hidden="true"
    focusable="false"
    class="shrink-0 @Class"
    fill="none"
    stroke="currentColor">
    <use href="@($"/icons/ui-icons.svg#{Name}")"></use>
</svg>

@code {
    [Parameter, EditorRequired]
    public string Name { get; set; } = string.Empty;

    [Parameter]
    public string Class { get; set; } = "size-5";
}
```

Przykład użycia:

```razor
<NavLink
    href="rooms"
    class="flex items-center gap-2 rounded-lg px-3 py-2">
    <AppIcon Name="building-2" />
    <span>Sale</span>
</NavLink>
```

Jeżeli komponent nie jest widoczny bez pełnej nazwy, należy dodać poniższy
import do pliku `_Imports.razor` projektu klienckiego:

```razor
@using FrontendBlazor.Client.Components.Ui
```

## Wspólne zasady wyglądu

- ikony w sidebarze: `size-5`;
- ikony w przyciskach: `size-4` lub dokładnie 18 px w obu aplikacjach;
- ikony w komunikatach i pustych stanach: `size-5`;
- odstęp między ikoną i tekstem: `gap-2`;
- ikona nie powinna zmieniać wymiarów podczas ładowania;
- kolor powinien pochodzić z `currentColor`;
- odpowiadające sobie elementy muszą mieć tę samą ikonę i klasy Tailwind;
- tekst przycisku lub linku pozostaje widoczny;
- nie należy mieszać ikon konturowych Lucide z ikonami wypełnionymi z innego
  zestawu.

## Dostępność

Ikona umieszczona obok tekstu jest dekoracyjna. Komponent ustawia wtedy
`aria-hidden="true"` oraz `focusable="false"`. Czytnik ekranu odczytuje widoczny
tekst linku albo przycisku bez powtarzania nazwy ikony.

```tsx
<button type="button">
  <AppIcon name="log-out" className="size-4" />
  <span>Wyloguj</span>
</button>
```

Jeżeli w przyszłości powstanie przycisk zawierający wyłącznie ikonę, przycisk
musi otrzymać nazwę opisującą akcję:

```tsx
<button type="button" aria-label="Wyloguj">
  <AppIcon name="log-out" />
</button>
```

Nie należy nadawać dekoracyjnemu `svg` własnego `aria-label`, jeśli obok
znajduje się już tekst.

## Zasady chroniące testy pomiarowe

### Zachowanie selektorów i semantyki

Dodanie ikony nie może zmienić:

- atrybutów `data-measurement-page`, `data-measurement-state`,
  `data-measurement-count` i `data-measurement-renderer`;
- tekstów przycisków oraz linków używanych przez Playwright;
- elementu semantycznego, na przykład `button`, `a`, `Link` albo `NavLink`;
- kolejności operacji, wywołań API i momentu ustawiania stanu `ready`;
- identyfikatorów pól formularza oraz ich etykiet;
- zachowania `prefetch={false}` w linkach Next.js.

Ikonę należy umieszczać wewnątrz istniejącego elementu interaktywnego. Nie
należy tworzyć dodatkowego przycisku ani linku tylko dla ikony.

Przykład bezpiecznej zmiany:

```tsx
<button type="submit">
  <AppIcon name="calendar-plus" className="size-4" />
  <span>Utwórz rezerwację</span>
</button>
```

Widoczny tekst i dostępna nazwa pozostają wtedy takie same, więc selektory typu
`getByRole("button", { name: "Utwórz rezerwację" })` nadal działają.

### Równe zasoby w obu aplikacjach

Sprite trzeba skopiować do obu projektów, a następnie porównać sumy SHA-256:

```powershell
Get-FileHash frontend-next/public/icons/ui-icons.svg -Algorithm SHA256
Get-FileHash frontend-blazor/FrontendBlazor/wwwroot/icons/ui-icons.svg -Algorithm SHA256
```

Obie wartości muszą być identyczne. To samo sprawdzenie należy wykonać dla
`google.svg`.

Oba frontendy powinny używać:

- tej samej liczby ikon na odpowiadającym ekranie;
- tych samych symboli SVG;
- tych samych rozmiarów i odstępów;
- tych samych zasad animacji;
- lokalnego adresu `/icons/ui-icons.svg`.

### Cache i profil pomiarowy

Lokalny sprite dodaje jedno żądanie statycznego zasobu. W wariancie
`fresh-context` zasób zostanie pobrany w nowym kontekście przeglądarki, a w
`warm-return` może pochodzić z cache. Jest to prawidłowe, jeśli obie aplikacje
używają identycznego pliku i sposobu odwołania.

Nie należy:

- pobierać ikon z CDN;
- ładować ikon dynamicznie z API;
- importować całej biblioteki ikon;
- używać innego pakietu ikon w każdym frontendzie;
- dodawać animacji wykonywanej bez końca;
- zmieniać ikon w zależności od szybkości odpowiedzi API.

### Kolejność wdrożenia

1. Zakończyć lub odrzucić dotychczasową kampanię pomiarową.
2. Przygotować minimalny sprite i zapisać wersję Lucide.
3. Skopiować identyczne pliki do obu frontendów.
4. Dodać komponent `AppIcon` do Next.js i Blazora.
5. Dodać podstawowy zestaw ikon w tych samych miejscach.
6. Porównać sumy SHA-256 plików.
7. Zbudować oba frontendy w trybie produkcyjnym.
8. Uruchomić testy funkcjonalne Playwright.
9. Wykonać nowy pilotaż pomiarowy.
10. Dopiero po udanym pilotażu rozpocząć nową kampanię właściwą.

Wyników uzyskanych przed dodaniem ikon nie należy łączyć z wynikami nowej
wersji interfejsu. Zmiana zasobów i struktury DOM wymaga nowego pilotażu zgodnie
z protokołem projektu `measurements`.

## Kontrola po wdrożeniu

Next.js:

```powershell
cd frontend-next
npm run lint
npm run build
```

Blazor:

```powershell
cd frontend-blazor
npm run build
npm run publish
```

Po ręcznym uruchomieniu produkcyjnego środowiska:

```powershell
cd measurements
npm run typecheck
npm run test:unit
npm test
```

Przykładowy pilotaż dla jednego wariantu:

```powershell
npm run measure:read -- --dataset=small --cache=fresh-context --repetitions=5 --warmups=2
npm run measure:write -- --dataset=small --cache=fresh-context --repetitions=5 --warmups=2
```

Pilotaż należy powtórzyć dla wariantów objętych właściwą kampanią. Trzeba
sprawdzić, czy testy nadal odnajdują przyciski po nazwie, czy ładowanie ikon nie
zmienia momentu ustawiania stanu `ready` oraz czy oba frontendy wyświetlają taki
sam zestaw symboli.

## Materiały źródłowe

- [Lucide — oficjalna lista pakietów i licencja](https://github.com/lucide-icons/lucide/blob/main/README.md)
- [W3C — dostępność ikon SVG](https://design-system.w3.org/styles/svg-icons.html)
- [WAI-ARIA — nadawanie dostępnych nazw](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)
