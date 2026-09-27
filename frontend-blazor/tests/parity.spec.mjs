import { expect, test } from "@playwright/test";

const origin = process.env.BLAZOR_TEST_URL || "http://localhost:5188";

const now = new Date();
const date = (offset, hour = 10) => new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() + offset,
  hour
).toISOString();

const localDateTime = (offset, hour = 10) => new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() + offset,
  hour
).toLocaleString("sv-SE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Warsaw",
}).replace(" ", "T");

const rooms = [
  { id: "a", name: "Alfa", location: "Warszawa", capacity: 8, isActive: true },
  { id: "b", name: "Beta", location: "Warszawa", capacity: 20, isActive: true },
];

const user = {
  id: "user",
  fullName: "Jan Testowy",
  email: "jan@example.test",
  hasLocalPassword: true,
  emailVerified: true,
  role: { name: "USER" },
};

test.beforeEach(async ({ page }) => {
  let reservations = [{
    id: "jutro",
    title: "Spotkanie jutro",
    roomId: "a",
    userId: user.id,
    startTime: date(1),
    endTime: date(1, 11),
    status: "ACTIVE",
    room: rooms[0],
  }];

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1", "");
    const method = route.request().method();
    let data;

    switch (true) {
      case path === "/auth/me":
        data = user;
        break;
      case path === "/dashboard":
        data = { activeRoomsCount: 2, nextReservations: reservations };
        break;
      case path === "/rooms":
        data = rooms;
        break;
      case /\/rooms\/[^/]+\/availability/.test(path):
        data = { roomId: "b", available: true, conflicts: [] };
        break;
      case path.startsWith("/rooms/"):
        data = rooms.find((room) => room.id === path.split("/")[2]);
        break;
      case path === "/reservations/my":
        data = reservations;
        break;
      case path === "/reservations" && method === "POST": {
        const body = route.request().postDataJSON();
        data = {
          id: "nowa",
          ...body,
          status: "ACTIVE",
          room: rooms.find((room) => room.id === body.roomId)
        };
        reservations.push(data);
        break;
      }
      case path.endsWith("/cancel"): {
        const id = path.split("/")[2];
        data = {
          ...reservations.find((reservation) => reservation.id === id),
          status: "CANCELLED"
        };
        reservations = reservations.map((reservation) => reservation.id === id ? data : reservation);
        break;
      }
      case path === "/auth/logout":
        data = { loggedOut: true };
        break;
      default:
        return route.fulfill({
          status: 404,
          body: JSON.stringify({ status: 404 })
        });
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, data })
    });
  });
});

test("filtruje sale i tworzy rezerwacje", async ({ page }) => {
  await page.goto(`${origin}/rooms`);
  await page.getByLabel("Minimalna liczba miejsc").fill("10");
  await expect(page.getByRole("article")).toHaveCount(1);

  await page.getByRole("link", { name: /Wybierz termin/ }).click();
  const start = localDateTime(1);
  await page.locator("#startTime").fill(start);
  await page.getByRole("button", { name: "1 godz.", exact: true }).click();

  await page.locator("#title").fill("Nowe spotkanie");
  await page.getByRole("button", { name: "Utwórz rezerwację", exact: true }).click();

  await expect(page.getByText("Rezerwacja utworzona", { exact: true })).toBeVisible();
});

test("anuluje rezerwacje", async ({ page }) => {
  await page.goto(`${origin}/reservations`);
  await page.getByRole("button", { name: "Anuluj rezerwację", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Anuluj rezerwację", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  await expect(page.getByText("Rezerwacja anulowana.", { exact: false })).toBeVisible();
});

test("loguje i wylogowuje uzytkownika", async ({ page }) => {
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({
    status: 401,
    contentType: "application/problem+json",
    body: JSON.stringify({ status: 401 }),
  }));

  await page.route("**/api/v1/auth/login", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: { user } }),
  }));

  await page.goto(`${origin}/login`);
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Haslo", { exact: true }).fill("test-password-123");
  await page.getByRole("button", { name: "Zaloguj sie", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Twój plan spotkań" })).toBeVisible();

  await page.getByRole("button", { name: "Wyloguj", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
