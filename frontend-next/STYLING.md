# Stylowanie

Oba frontendowy uzywaja Tailwind CSS 4.3.1.
Kazdy buduje CSS niezaleznie i importuje lokalny plik theme.css
Nie ma importow spoza katalogu danego frontendu

Pliki frontend-next/app/theme.css i frontend-blazor/Styles/theme.css powinny miec identyczna zawartosc

- Next.js kompiluje app/globals.css przez PostCSS podczas
  - npm run dev lub
  - npm run build

- Blazor kompiluje Styles/tailwind.css przez
  - npm run css:build (jednorazowo) lub
  - npm run css:watch (podczas pracy)

- npm run build w blazor buduje najpierw CSS, a pozniej apke .NET
Nie można edytować recznie FrontendBlazor/wwwroot/app.css: jest generowany automatycznie

Globalne style domyslne sa w @layer base, aby klasy Tailwinda mogly je nadpisywac.
Style walidacji i bledow specyficzne dla Blazora są w Styles/tailwind.css
