# Zakres scenariuszy

## Read-only user flow

```text
Dashboard
  -> lista sal
  -> szczegoly Sali A-101
  -> lista rezerwacji
```

Scenariusz nie zmienia bazy. Kazda strona musi osiagnac stan `ready`, a liczba sal
i rezerwacji musi odpowiadac aktywnemu datasetowi.

## Write user flow

```text
Lista sal
  -> szczegoly Sali A-101
  -> utworzenie rezerwacji [TEST-RUN]
  -> lista rezerwacji
  -> anulowanie utworzonej rezerwacji
```

Kontroler kampanii uruchamia seed przed kazda probka, aby poprzednie anulowane
rezerwacje nie zwiekszaly rozmiaru kolejnych odpowiedzi.
