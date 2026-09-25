import type { Page } from "@playwright/test";
import {
  test, expect, expectedCount, measureStep, prepareCacheState,
  waitForMeasurementPage, waitForCalendar,
} from "./test-helpers";
import { roomDetailsLink } from "./view-helpers";

function browserDateTime(page: Page, date: Date) {
  return page.evaluate((timestamp) => {
    const offset = new Date(timestamp).getTimezoneOffset() * 60_000;
    return new Date(timestamp - offset).toISOString().slice(0, 16);
  }, date.getTime());
}

test("create and cancel reservation", async ({ page }, info) => {
  await prepareCacheState(page, info);

  const sampleIndex = process.env.MEASUREMENT_SAMPLE_INDEX ?? "manual";
  const title = `[TEST-RUN] ${info.project.name}-${sampleIndex}-${Date.now()}`;
  const start = new Date(Date.now() + (12 + info.repeatEachIndex) * 86_400_000);

  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);

  await page.goto("/rooms");
  const roomsPage = await waitForMeasurementPage(page, "rooms");
  await expect(roomsPage).toHaveAttribute("data-measurement-count", String(expectedCount(info, "roomCount")));

  await roomDetailsLink(page).click();
  await waitForMeasurementPage(page, "room-details");
  await page.getByLabel("Nazwa rezerwacji", { exact: true }).fill(title);

  const description = page.getByLabel(/opis/i);
  if (await description.count()) await description.fill("Automatyczny pomiar Playwright.");
  await page.getByLabel(/początek|poczatek/i).fill(await browserDateTime(page, start));
  await page.getByLabel("Koniec", { exact: true }).fill(await browserDateTime(page, end));

  await measureStep(info, page, "create-reservation", async () => {
    await page.getByRole("button", { name: /zarezerwuj|utwórz rezerwację|utworz rezerwacje/i }).click();
    await expect(page.getByText("Rezerwacja utworzona", { exact: true })).toBeVisible();
  });

  await measureStep(info, page, "new-reservation-visible", async () => {
    await page.goto("/reservations");
    await waitForMeasurementPage(page, "reservations");
    await expect(page.getByText(title)).toBeVisible();
  });
  await waitForCalendar(page);

  // mierzymy też dialog i przejście do zakładki z anulowaną rezerwacją
  await measureStep(info, page, "cancel-reservation", async () => {
    const reservation = page.locator("article")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) });

    await reservation.getByRole("button", { name: /anuluj/i }).click();

    await page.getByRole("dialog").getByRole("button", { name: "Anuluj rezerwację", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: /^Anulowane/ }).click();
    await expect(reservation.getByText(/cancelled|anulowana/i)).toBeVisible();
  });
});
