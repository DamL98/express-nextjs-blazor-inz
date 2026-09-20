# Stylowanie

Oba frontendowe projekty uzywaja Tailwind CSS 4.3.1. Kazdy buduje CSS niezaleznie i importuje lokalny plik theme.css. Nie ma importow spoza katalogu danego frontendu.

Pliki frontend-next/app/theme.css i frontend-blazor/Styles/theme.css powinny miec identyczna zawartosc. Zmiany wspolnych kolorow, wymiarow i cieni wprowadzaj w obu kopiach. W komponentach React i Razor uzywaj tych samych klas, np. border-app-line, shadow-login i rounded-control.

Next.js kompiluje app/globals.css przez PostCSS podczas npm run dev lub npm run build. Blazor kompiluje Styles/tailwind.css przez npm run css:build (jednorazowo) lub npm run css:watch (podczas pracy). Polecenie npm run build w frontend-blazor buduje najpierw CSS, a nastepnie aplikacje .NET. Nie edytuj recznie FrontendBlazor/wwwroot/app.css: jest generowany.

Globalne style domyslne sa w @layer base, aby klasy Tailwinda mogly je nadpisywac. Style walidacji i bledow specyficzne dla Blazora pozostaja w Styles/tailwind.css.
