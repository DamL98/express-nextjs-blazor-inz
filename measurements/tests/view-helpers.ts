import { expect, type Locator, type Page } from "@playwright/test";
import { urls } from "../measurement-config";

export type Room = {
  id: string;
  name: string;
  location: string;
  capacity: number
};
export type Reservation = {
  id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
};

export async function readDataset<T>(page: Page, endpoint: string, count: number): Promise<T[]> {
  const response = await page.request.get(`${urls.api}${endpoint}`);
  expect(response.ok()).toBe(true);

  const records = (await response.json()).data;
  expect(records).toHaveLength(count);

  return records;
}

// Porównujemy kolejność wszystkich kart, nie tylko licznik pobranych rekordów.
export async function expectCards(root: Page | Locator, kind: string, records: { id: string }[]) {
  const attribute = `data-measurement-${kind}-id`;

  await expect
    .poll(() => root.locator(`[${attribute}]`)
    .evaluateAll((cards, name) => cards.map((card) => card.getAttribute(name)), attribute,))
    .toEqual(records.map((record) => record.id));
}

export function roomDetailsLink(page: Page) {
  return page.locator("article")
    .filter({ has: page.getByRole("heading", { name: "Sala A-101", exact: true }) })
    .getByRole("link", { name: /wybierz termin|zobacz szczeg/i });
}

export function calendarDay(calendar: Locator, date: string) {
  return calendar.locator(`[data-measurement-day="${date}"]`);
}

export function shiftedMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);

  return new Date(Date.UTC(year, number - 1 + offset, 1))
    .toISOString()
    .slice(0, 7);
}

export async function moveCalendar(calendar: Locator, direction: number, currentMonth?: string) {
  const month = currentMonth ?? (await calendar.getAttribute("data-measurement-month"))!;
  const nextMonth = shiftedMonth(month, direction);

  await calendar.getByRole("button", {
    name: direction > 0 ? "Następny miesiąc" : "Poprzedni miesiąc", exact: true,
  }).click();

  await expect(calendar).toHaveAttribute("data-measurement-month", nextMonth);

  return nextMonth;
}

export async function showCalendarMonth(calendar: Locator, targetMonth: string) {
  for (let moves = 0; moves < 120; moves++) {
    const month = (await calendar.getAttribute("data-measurement-month"))!;
    if (month === targetMonth) return;
    await moveCalendar(calendar, month < targetMonth ? 1 : -1);
  }
  throw new Error("Miesiąc datasetu jest zbyt odległy od miesiąca kalendarza.");
}

// Funkcja działa w przeglądarce, więc używa tej samej strefy dat co widok.
export function busiestDay(reservations: Reservation[]) {
  const active = reservations.filter((reservation) => reservation.status === "ACTIVE");

  const days = active.map((reservation) => {
    const date = new Date(reservation.startTime);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const records = active
      .filter((item) => Date.parse(item.startTime) < +end && Date.parse(item.endTime) > +start)
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));

    const day = new Date(+start - start.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);

    return { day, records };
  });

  return days.sort((a, b) => b.records.length - a.records.length)[0];
}
