import {
  expect,
  expectedCount,
  measureStep,
  prepareCacheState,
  test,
  waitForMeasurementPage,
} from "./test-helpers";
import type { Page } from "@playwright/test";

function toBrowserDateTime(page: Page, date: Date): Promise<string> {
  return page.evaluate((milliseconds) => {
    const value = new Date(milliseconds);
    const localTime = milliseconds - value.getTimezoneOffset() * 60_000;
    return new Date(localTime).toISOString().slice(0, 16);
  }, date.getTime());
}

test("create and cancel reservation", async ({ page }, testInfo) => {
  await prepareCacheState(page, testInfo);

  const sampleIndex = process.env.MEASUREMENT_SAMPLE_INDEX ?? "manual";
  const uniqueSuffix = `${testInfo.project.name}-${sampleIndex}-${Date.now()}`;

  const title = `[TEST-RUN] ${uniqueSuffix}`;

  // Termin powinien być wystarczająco odległy i zmieniać się
  // między powtórzeniami, żeby unikać konfliktów
  const offsetDays = 12 + testInfo.repeatEachIndex;
  const startDate = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

  startDate.setHours(10, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(11, 0, 0, 0);

  await page.goto("/rooms");
  const roomsPage = await waitForMeasurementPage(page, "rooms");
  await expect(roomsPage).toHaveAttribute(
    "data-measurement-count",
    String(expectedCount(testInfo, "roomCount")),
  );

  const roomCard = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Sala A-101",
      exact: true,
    }),
  });

  await roomCard.getByRole("link", { name: /zobacz szczeg/i }).click();
  await waitForMeasurementPage(page, "room-details");

  await page.getByLabel("Nazwa rezerwacji", { exact: true }).fill(title);

  const description = page.getByLabel(/opis/i);
  if (await description.count()) {
    await description.fill("Automatyczny pomiar Playwright.");
  }

  await page
    .getByLabel(/początek|poczatek/i)
    .fill(await toBrowserDateTime(page, startDate));
  await page
    .getByLabel("Koniec", { exact: true })
    .fill(await toBrowserDateTime(page, endDate));

  await measureStep(testInfo, page, "create-reservation", async () => {
    await page
      .getByRole("button", {
        name: /zarezerwuj|utwórz rezerwację|utworz rezerwacje/i,
      })
      .click();

    await expect(page.getByText("Rezerwacja utworzona", { exact: true })).toBeVisible();
  });

  await measureStep(testInfo, page, "new-reservation-visible", async () => {
    await page.goto("/reservations");
    await waitForMeasurementPage(page, "reservations");
    await expect(page.getByText(title)).toBeVisible();
  });

  await expect(page.locator("[data-measurement-calendar]")).toHaveAttribute(
    "data-measurement-calendar",
    "ready",
  );

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  await measureStep(testInfo, page, "cancel-reservation", async () => {
    const reservationContainer = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });

    await reservationContainer.getByRole("button", { name: /anuluj/i }).click();

    await expect(reservationContainer.getByText(/cancelled|anulowana/i)).toBeVisible();
  });
});
