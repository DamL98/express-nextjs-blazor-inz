# Reguly
- rezerwacja dot. tylko jednej sali
- rezerwacja należy do jednego usera
- start_time musi byc wczesniej niż end_time
- blokada aby nie mozna utw. dwóch rezerwacji w tej samej sali w tym samym czasie
- rezerwacja nie usuwa sie z db
- anulowanie to zmiana status z ACTIVE na CANCELED
- rezerwacja moze byc synchr. z google calendar
- po synchro z google calendar jest save w DB w google_calendar_event_id
