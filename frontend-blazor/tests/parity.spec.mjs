import {
  test,
  expect,
} from "../../measurements/node_modules/@playwright/test/index.mjs";

const origin = process.env.BLAZOR_TEST_URL || "http://localhost:5188";
process.env.TZ = "Europe/Warsaw";
const now = new Date();
const day = (offset, hour = 10) =>
  new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + offset,
    hour,
  ).toISOString();
const room = (id, name, capacity, isActive = true) => ({
  id,
  name,
  location: "Warszawa",
  description: "Sala testowa",
  capacity,
  isActive,
  createdAt: day(-30),
  updatedAt: day(-1),
});
const rooms = [
  room("a", "Alfa", 8),
  room("b", "Beta", 20),
  room("c", "Gamma", 12, false),
];
const reservation = (id, start, end, status = "ACTIVE") => ({
  id,
  title: `Spotkanie ${id}`,
  roomId: "a",
  userId: "user",
  description: "Opis spotkania",
  startTime: start,
  endTime: end,
  status,
  room: rooms[0],
  createdAt: day(-5),
  updatedAt: day(-1),
  googleCalendarEventId: null,
});

test.beforeEach(async ({ page }) => {
  let reservations = [
    reservation("jutro", day(1), day(1, 11)),
    reservation("historia", day(-2), day(-2, 11)),
    reservation("anulowane", day(2), day(2, 11), "CANCELLED"),
    reservation("wielodniowe", day(-1, 23), day(1, 0)),
  ];
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1", "");
    const method = route.request().method();
    let data;
    if (path === "/auth/me")
      data = {
        id: "user",
        fullName: "Jan Testowy",
        email: "jan@example.test",
        hasLocalPassword: true,
        googleId: "google",
        emailVerified: true,
        role: { name: "USER" },
      };
    else if (path === "/dashboard")
      data = {
        activeRoomsCount: 2,
        nextReservations: reservations.slice(0, 1),
      };
    else if (path === "/rooms") data = rooms;
    else if (/\/rooms\/[^/]+\/availability/.test(path))
      data = {
        roomId: "a",
        available: true,
        start: url.searchParams.get("start"),
        end: url.searchParams.get("end"),
        conflicts: [],
      };
    else if (path.startsWith("/rooms/"))
      data = rooms.find((r) => r.id === path.split("/")[2]);
    else if (path === "/reservations/my") data = reservations;
    else if (path === "/reservations" && method === "POST") {
      const body = route.request().postDataJSON();
      data = { ...reservation("nowe", body.startTime, body.endTime), ...body };
      reservations.push(data);
    } else if (path.endsWith("/cancel")) {
      const id = path.split("/")[2];
      data = { ...reservations.find((r) => r.id === id), status: "CANCELLED" };
      reservations = reservations.map((r) => (r.id === id ? data : r));
    } else if (path === "/google-calendar/status")
      data = {
        connected: true,
        provider: "google",
        calendarEmail: "jan@example.test",
        connectedAt: day(-5),
        tokenExpiresAt: day(1),
        syncEnabled: false,
      };
    else if (path === "/auth/password/change")
      data = { message: "Hasło zmienione" };
    else
      return route.fulfill({
        status: 404,
        contentType: "application/problem+json",
        body: JSON.stringify({ title: "Unexpected test request", status: 404 }),
      });
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, data }),
    });
  });
});

test("filtry sal w URL, zachowanie filtrów i rezerwacja", async ({ page }) => {
  await page.goto(`${origin}/rooms`);
  await expect(page.locator('[data-measurement-state="ready"]')).toBeVisible();
  await page.getByLabel("Minimalna liczba miejsc").fill("10");
  await page.getByLabel("Możliwość rezerwacji").selectOption("true");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page).toHaveURL(/capacity=10.*active=true/);
  await page.getByRole("link", { name: /Wybierz termin/ }).click();
  await page.getByRole("link", { name: "Wróć do listy sal" }).click();
  await expect(page.getByLabel("Minimalna liczba miejsc")).toHaveValue("10");
  await page.getByRole("link", { name: /Wybierz termin/ }).click();
  const localDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 2,
    10,
  );
  const value = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}T10:00`;
  await page.locator("#startTime").fill(value);
  await page.getByRole("button", { name: "1 godz.", exact: true }).click();
  await expect(page.locator("#endTime")).toHaveValue(
    value.replace("10:00", "11:00"),
  );
  await page.locator("#title").fill("Nowe spotkanie testowe");
  await page
    .getByRole("button", { name: "Utwórz rezerwację", exact: true })
    .click();
  await expect(
    page.getByText("Rezerwacja utworzona", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Nowe spotkanie testowe — Beta")).toBeVisible();
  await expect(page.locator("#title")).toHaveValue("");
});

test("zakładki i anulowanie z dialogiem oraz przywróceniem fokusu", async ({
  page,
}) => {
  await page.goto(`${origin}/reservations`);
  await expect(
    page.getByRole("heading", { name: "Spotkanie jutro", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Spotkanie historia", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /^Historia/ }).click();
  await expect(
    page.getByRole("heading", { name: "Spotkanie historia", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Nadchodzące/ }).click();
  await page.getByLabel("Znajdź rezerwację").fill("jutro");
  await page
    .getByRole("button", { name: "Anuluj rezerwację", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Anuluj rezerwację", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Anuluj rezerwację", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Anuluj rezerwację", exact: true })
    .click();
  await expect(
    page.getByText("Rezerwacja anulowana.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("#reservation-search")).toBeFocused();
  await page.getByRole("button", { name: /^Anulowane/ }).click();
  await expect(
    page.getByRole("heading", { name: "Spotkanie jutro", exact: true }),
  ).toBeVisible();
});

test("kalendarz wielodniowy, zmiana miesiąca i odświeżanie", async ({
  page,
}) => {
  await page.goto(origin);
  await expect(
    page.locator('[data-measurement-reservation-calendar="ready"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Spotkanie wielodniowe", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Spotkanie anulowane", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("table", { name: "Kalendarz rezerwacji" })
      .getByRole("button"),
  ).toHaveCount(42);
  await page.getByRole("button", { name: "Następny miesiąc" }).click();
  await page.getByRole("button", { name: "Dzisiaj", exact: true }).click();
  await page
    .getByRole("button", { name: "Odśwież rezerwacje", exact: true })
    .click();
  await expect(
    page.locator('[data-measurement-reservation-calendar="ready"]'),
  ).toBeVisible();
  await page.screenshot({
    path: "../measurements/test-results/blazor-dashboard.png",
    fullPage: true,
  });
});

test("ustawienia i nawigacja mobilna", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/rooms`);
  await page
    .getByRole("navigation", { name: "Nawigacja mobilna" })
    .getByRole("link", { name: "Ustawienia" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ustawienia konta" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Połączenie jest zapisane, ale synchronizacja nie jest włączona.",
      { exact: false },
    ),
  ).toBeVisible();
  await page.getByLabel("Aktualne hasło").fill("test-password-123");
  await page.getByLabel("Nowe hasło", { exact: true }).fill("new-password-123");
  await page.getByRole("button", { name: "Zmień hasło" }).click();
  await expect(
    page.getByText("Hasło zmienione", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../measurements/test-results/blazor-settings-mobile.png",
    fullPage: true,
  });
});

test("kalendarz zachowuje terminy przy błędzie pobrania sal", async ({
  page,
}) => {
  await page.route("**/api/v1/rooms", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/problem+json",
      body: JSON.stringify({ status: 503, title: "Sale chwilowo niedostępne" }),
    }),
  );
  await page.goto(origin);
  await expect(
    page.locator('[data-measurement-reservation-calendar="ready"]'),
  ).toBeVisible();
  await expect(
    page.getByText("Nazwy sal chwilowo niedostępne.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Spotkanie wielodniowe", exact: true }),
  ).toBeVisible();
});

test("błąd anulowania pozostawia dialog i umożliwia ponowienie", async ({
  page,
}) => {
  let attempt = 0;
  await page.route("**/api/v1/reservations/*/cancel", async (route) => {
    if (++attempt > 1) return route.fallback();
    return route.fulfill({
      status: 503,
      contentType: "application/problem+json",
      body: JSON.stringify({ status: 503, title: "Spróbuj ponownie później" }),
    });
  });
  await page.goto(`${origin}/reservations`);
  await page.getByLabel("Znajdź rezerwację").fill("jutro");
  await page
    .getByRole("button", { name: "Anuluj rezerwację", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Anuluj rezerwację", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Spróbuj ponownie później",
  );
  await dialog
    .getByRole("button", { name: "Anuluj rezerwację", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByText("Rezerwacja anulowana.", { exact: false }),
  ).toBeVisible();
});

test("błąd kalendarza, ponowienie i granica północy", async ({ page }) => {
  let attempt = 0;
  await page.route("**/api/v1/reservations/my", (route) =>
    ++attempt === 1
      ? route.fulfill({
          status: 503,
          contentType: "application/problem+json",
          body: JSON.stringify({ status: 503, title: "Błąd kalendarza" }),
        })
      : route.fallback(),
  );
  await page.goto(origin);
  const calendar = page.locator("[data-measurement-reservation-calendar]");
  await expect(calendar).toHaveAttribute(
    "data-measurement-reservation-calendar",
    "error",
  );
  await calendar.getByRole("button", { name: "Spróbuj ponownie" }).click();
  await expect(calendar).toHaveAttribute(
    "data-measurement-reservation-calendar",
    "ready",
  );
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const label = tomorrow.toLocaleDateString("pl-PL", { dateStyle: "full" });
  // Reservation ending exactly at midnight must not overlap the following day.
  await calendar
    .getByRole("button", {
      name: `${label}. Liczba aktywnych rezerwacji: 1`,
      exact: true,
    })
    .click();
  await expect(
    calendar.getByRole("heading", {
      name: "Spotkanie wielodniowe",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    calendar.getByRole("heading", { name: "Spotkanie jutro", exact: true }),
  ).toBeVisible();
});

test("nieaktywna sala, puste wyniki i wygaśnięcie sesji", async ({ page }) => {
  await page.goto(`${origin}/rooms/c`);
  await expect(
    page.getByRole("heading", { name: "Ta sala jest wyłączona z rezerwacji" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Utwórz rezerwację", exact: true }),
  ).toHaveCount(0);
  await page.goto(`${origin}/rooms?search=nieistniejąca`);
  await expect(
    page.getByRole("heading", { name: "Nie znaleziono sal" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Wyczyść filtry" }).click();
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.route("**/api/v1/reservations/my", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/problem+json",
      body: JSON.stringify({ status: 401, title: "Sesja wygasła" }),
    }),
  );
  await page
    .getByRole("navigation", { name: "Nawigacja główna" })
    .getByRole("link", { name: "Moje rezerwacje" })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("form", { name: "Logowanie lokalne" }),
  ).toBeVisible();
});
