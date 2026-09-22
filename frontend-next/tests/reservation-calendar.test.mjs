import assert from "node:assert/strict";
import test from "node:test";

import { getDayReservations } from "../lib/reservation-calendar.ts";

process.env.TZ = "Europe/Warsaw";

function reservation(id, startTime, endTime, status = "ACTIVE") {
  return { id, startTime, endTime, status };
}

test("Zaznacza wszystkie aktywne rezerwacje dnia i sortuje je według początku", () => {
  const reservations = [
    reservation("late", "2026-09-23T14:00:00+02:00", "2026-09-23T15:00:00+02:00"),
    reservation("cancelled", "2026-09-23T09:00:00+02:00", "2026-09-23T10:00:00+02:00", "CANCELLED"),
    reservation("early", "2026-09-23T10:00:00+02:00", "2026-09-23T11:00:00+02:00"),
  ];
  const original = structuredClone(reservations);

  assert.deepEqual(getDayReservations(reservations, new Date(2026, 8, 23)).map((item) => item.id), ["early", "late"]);
  assert.deepEqual(reservations, original);
});

test("Rezerwacja przez północ zaznacza oba dni, również na granicy miesięcy", () => {
  const reservations = [reservation("night", "2026-09-30T23:00:00+02:00", "2026-10-01T01:00:00+02:00")];

  assert.equal(getDayReservations(reservations, new Date(2026, 8, 30)).length, 1);
  assert.equal(getDayReservations(reservations, new Date(2026, 9, 1)).length, 1);
  assert.equal(getDayReservations(reservations, new Date(2026, 9, 2)).length, 0);
});

test("Koniec dokładnie o północy nie zajmuje następnego dnia", () => {
  const reservations = [reservation("midnight", "2026-09-23T23:00:00+02:00", "2026-09-24T00:00:00+02:00")];

  assert.equal(getDayReservations(reservations, new Date(2026, 8, 23)).length, 1);
  assert.equal(getDayReservations(reservations, new Date(2026, 8, 24)).length, 0);
});

test("Dzień zmiany czasu na letni nie obejmuje początku następnego dnia", () => {
  const reservations = [reservation("next", "2026-03-30T00:15:00+02:00", "2026-03-30T01:00:00+02:00")];

  assert.equal(getDayReservations(reservations, new Date(2026, 2, 29)).length, 0);
  assert.equal(getDayReservations(reservations, new Date(2026, 2, 30)).length, 1);
});

test("Dzień zmiany czasu na zimowy obejmuje ostatnią godzinę dłuższego dnia", () => {
  const reservations = [reservation("late", "2026-10-25T23:15:00+01:00", "2026-10-26T00:00:00+01:00")];

  assert.equal(getDayReservations(reservations, new Date(2026, 9, 25)).length, 1);
  assert.equal(getDayReservations(reservations, new Date(2026, 9, 26)).length, 0);
});

test("Nie zaznacza niepoprawnego zakresu ani niepoprawnej daty", () => {
  const reservations = [
    reservation("invalid", "invalid", "2026-09-23T12:00:00+02:00"),
    reservation("reversed", "2026-09-23T13:00:00+02:00", "2026-09-23T12:00:00+02:00"),
    reservation("empty", "2026-09-23T12:00:00+02:00", "2026-09-23T12:00:00+02:00"),
  ];

  assert.equal(getDayReservations(reservations, new Date(2026, 8, 23)).length, 0);
});
