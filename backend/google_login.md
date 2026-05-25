1. user klika "Zaloguj przez Google" na froncie
2. front odpala endpoint api z backendu
3. backend uruchamia Google OAuth z kontrolera OAuth
4. Google zwraca dane usera do backendu
5. Backend sprawdza, czy user istnieje w tabeli users
6. Jeśli user nie istnieje, backend tworzy rekord w users
7. Backend przypisuje userowi rolę user
8. Backend zwraca do fronta token jwt