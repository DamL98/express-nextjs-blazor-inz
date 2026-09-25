import { test, expect, expectedCount, measureStep, prepareCacheState, openPage, waitForCalendar } from "./test-helpers";
import {
  readDataset, expectCards, busiestDay, calendarDay, moveCalendar, showCalendarMonth,
  type Room, type Reservation,
} from "./view-helpers";

test.beforeEach(async ({ page }, info) => prepareCacheState(page, info));

for (const operation of ["search", "capacity", "sort", "clear"] as const) {
  test(`rooms-${operation}`, async ({ page }, info) => {
    const rooms = await readDataset<Room>(page, "/rooms", expectedCount(info, "roomCount"));

    await openPage(page, "rooms");

    const byName = (a: Room, b: Room) => a.name.localeCompare(b.name, "pl");
    const allRooms = [...rooms].sort(byName);
    const searchResults = allRooms.filter((room) => `${room.name} ${room.location}`.includes("A-101"));
    const minimumCapacity = [...rooms].sort((a, b) => a.capacity - b.capacity)[Math.floor(rooms.length / 2)].capacity;
    const search = page.getByLabel("Nazwa lub lokalizacja");

    await expectCards(page, "room", allRooms);

    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults.length).toBeLessThan(rooms.length);

    if (operation === "clear") {
      await search.fill("A-101");
      await expectCards(page, "room", searchResults);
    }

    const scenarios = {
      search: { action: () => search.fill("A-101"), expected: searchResults },
      capacity: {
        action: () => page.getByLabel("Minimalna liczba miejsc").fill(String(minimumCapacity)),
        expected: allRooms.filter((room) => room.capacity >= minimumCapacity),
      },
      sort: {
        action: () => page.getByLabel("Sortowanie").selectOption("capacity-desc"),
        expected: [...rooms].sort((a, b) => b.capacity - a.capacity),
      },
      clear: {
        action: () => page.getByRole("button", { name: "Wyczyść filtry" }).click(),
        expected: allRooms,
      },
    };

    const scenario = scenarios[operation];
    await measureStep(info, page, `rooms-${operation}`, async () => {
      await scenario.action();
      await expectCards(page, "room", scenario.expected);
    });
  });
}

for (const operation of ["all", "history", "cancelled", "search", "clear"] as const) {
  test(`reservations-${operation}`, async ({ page }, info) => {
    const reservations = await readDataset<Reservation>(page, "/reservations/my", expectedCount(info, "reservationCount"));
    const now = Date.now();

    // Nie dopuszczamy zmiany grupy czasowej w trakcie próby.
    expect(reservations.every((item) => Math.abs(Date.parse(item.endTime) - now) > 120_000)).toBe(true);
    await openPage(page, "reservations");
    await waitForCalendar(page);

    const allReservations = reservations.sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime));
    const searchTitle = allReservations[0].title;
    const searchResults = allReservations.filter((item) => item.title.includes(searchTitle));
    const search = page.getByLabel("Znajdź rezerwację");

    async function selectTab(name: RegExp) {
      const tab = page.getByRole("button", { name });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-pressed", "true");
    }

    if (operation === "search" || operation === "clear") {
      await selectTab(/^Wszystkie/);
      await expectCards(page, "reservation", allReservations);
    }

    if (operation === "clear") {
      await search.fill(searchTitle);
      await expectCards(page, "reservation", searchResults);
    }

    const scenarios = {
      all: { action: () => selectTab(/^Wszystkie/), expected: allReservations },
      history: {
        action: () => selectTab(/^Historia/),
        expected: allReservations.filter((item) => item.status !== "CANCELLED" && Date.parse(item.endTime) <= now),
      },
      cancelled: {
        action: () => selectTab(/^Anulowane/),
        expected: allReservations.filter((item) => item.status === "CANCELLED"),
      },
      search: { action: () => search.fill(searchTitle), expected: searchResults },
      clear: { action: () => search.fill(""), expected: allReservations },
    };

    const scenario = scenarios[operation];
    expect(scenario.expected.length).toBeGreaterThan(0);

    await measureStep(info, page, `reservations-${operation}`, async () => {
      await scenario.action();
      await expectCards(page, "reservation", scenario.expected);
    });
  });
}

for (const operation of ["month", "day"] as const) {
  test(`calendar-${operation}`, async ({ page }, info) => {
    const reservations = await readDataset<Reservation>(page, "/reservations/my", expectedCount(info, "reservationCount"));
    await openPage(page, "dashboard");

    const calendar = page.locator("[data-measurement-reservation-calendar]");
    const target = await page.evaluate(busiestDay, reservations);
    expect(target).toBeDefined();

    const month = target.day.slice(0, 7);
    await showCalendarMonth(calendar, month);

    if (operation === "day") {
      const otherDay = calendar.locator(`[data-measurement-day^="${month}-"]:not([data-measurement-day="${target.day}"])`).first();
      const date = (await otherDay.getAttribute("data-measurement-day"))!;
      await otherDay.click();
      await expect(calendar).toHaveAttribute("data-measurement-selected-day", date);
    }

    await measureStep(info, page, `calendar-${operation}`, async () => {
      if (operation === "month") {
        const nextMonth = await moveCalendar(calendar, 1, month);
        await expect(calendarDay(calendar, `${nextMonth}-15`)).toBeVisible();
      } else {
        await calendarDay(calendar, target.day).click();
        await expect(calendar).toHaveAttribute("data-measurement-selected-day", target.day);
        await expectCards(calendar, "calendar-reservation", target.records);
      }
    });
  });
}
