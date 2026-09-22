import assert from "node:assert/strict";
import test from "node:test";

import { filterRooms, getReservationGroup } from "../lib/view-filters.ts";

const rooms = [
  { id: "1", name: "Sala Żółta", location: "Łódź, budynek A", capacity: 8, isActive: true },
  { id: "2", name: "Sala B", location: "Łódź, budynek A", capacity: 20, isActive: false },
  { id: "3", name: "Sala C", location: "Budynek C", capacity: 12, isActive: true },
];
const filters = { search: "", capacity: "", active: "all", sort: "name" };

test("Łączy polską frazę, pojemność i aktywność bez zmiany danych sal", () => {
  const original = structuredClone(rooms);
  const result = filterRooms(rooms, { ...filters, search: "  ŁÓDŹ  ", capacity: "8", active: "true" });

  assert.deepEqual(result.map((room) => room.id), ["1"]);
  assert.deepEqual(rooms, original);
});

test("Sortowanie po pojemności nie przestawia źródłowej listy", () => {
  assert.deepEqual(filterRooms(rooms, { ...filters, sort: "capacity-desc" }).map((room) => room.id), ["2", "3", "1"]);
  assert.deepEqual(rooms.map((room) => room.id), ["1", "2", "3"]);
});

test("Nieprawidłowe parametry adresu nie ukrywają wszystkich sal", () => {
  assert.equal(filterRooms(rooms, { ...filters, capacity: "tekst", active: "nieznany" }).length, 3);
});

test("Brak dopasowania zwraca pustą listę, a nie cały katalog", () => {
  assert.equal(filterRooms(rooms, { ...filters, capacity: "30" }).length, 0);
});

test("Koniec spotkania przenosi aktywną rezerwację do historii dokładnie na granicy", () => {
  const endTime = "2026-09-23T10:00:00Z";
  const reservation = { status: "ACTIVE", endTime };
  const end = Date.parse(endTime);

  assert.equal(getReservationGroup(reservation, end - 1), "upcoming");
  assert.equal(getReservationGroup(reservation, end), "history");
});

test("Anulowana rezerwacja pozostaje anulowana niezależnie od daty", () => {
  const reservation = { status: "CANCELLED", endTime: "2026-09-23T10:00:00Z" };

  assert.equal(getReservationGroup(reservation, Date.parse("2026-09-22T10:00:00Z")), "cancelled");
  assert.equal(getReservationGroup(reservation, Date.parse("2026-09-24T10:00:00Z")), "cancelled");
});
