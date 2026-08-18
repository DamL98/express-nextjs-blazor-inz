# Rezerwacje
- Rezerwację może utworzyć wyłącznie uwierzytelniony użytkownik
- Rezerwacja dotyczy jednego użytkownika i jednej sali
- Sala musi istnieć i być aktywna
- Termin rozpoczęcia musi być wcześniejszy niż termin zakończenia
- Nie można utworzyć rezerwacji rozpoczynającej się w przeszłości
- Nowa rezerwacja nie może nakładać się na aktywną rezerwację tej samej sali
- Rezerwacje anulowane nie blokują terminu
- Terminy stykające się granicami, np. 10:00–11:00 i 11:00–12:00, nie są traktowane jako konflikt
- Użytkownik może zobaczyć i anulować tylko własne rezerwacje
- Ponowne anulowanie już anulowanej rezerwacji nie powoduje błędu

# Google Calendar
- Integracja opcjonalna
- Refresh token Google jest przechowywany zaszyfrowany w bazie
- Po utworzeniu rezerwacji jest próba utworzenia wydarzenia w google kalendarzu
- Niepowodzenie synchronizacji nie wycofuje utworzonej rezerwacji
- Identyfikator wydarzenia jest zapisywany dopiero po udanej synchronizacji
- Przy anulowaniu rezerwacji wydarzenie usuwane jest z kalendarza
- Błąd usunięcia wydarzenia nie blokuje anulowania rezerwacji w aplikacji

# Administrator
- Administrator może przeglądać rezerwacje wszystkich użytkowników
- Administrator może anulować cudzą rezerwację
- Dostęp do modułu wymaga roli admin
