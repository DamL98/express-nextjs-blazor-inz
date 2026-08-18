import { expect, test } from "@playwright/test";
import {
  expectedCount,
  measureStep,
  prepareCacheState,
  waitForMeasurementPage,
} from "./measurement-utils";

test("read-only user flow", async ({ page }, testInfo) => {
  await prepareCacheState(page, testInfo);

  await measureStep(testInfo, page, "dashboard-ready", async () => {
    await page.goto("/");
    await waitForMeasurementPage(page, "dashboard");
  });

  await expect(
    page.getByRole("heading", { name: /dashboard/i }),
  ).toBeVisible();

  await measureStep(testInfo, page, "rooms-list-ready", async () => {
    await page.goto("/rooms");
    await waitForMeasurementPage(page, "rooms");
  });

  const roomsPage = page.locator('[data-measurement-page="rooms"]');
  await expect(roomsPage).toHaveAttribute(
    "data-measurement-count",
    String(expectedCount(testInfo, "roomCount")),
  );
  await expect(page.getByText("Sala A-101", { exact: true })).toBeVisible();

  await measureStep(testInfo, page, "room-details-ready", async () => {
    const roomCard = page.locator("article").filter({
      has: page.getByRole("heading", {
        name: "Sala A-101",
        exact: true,
      }),
    });

    await roomCard.getByRole("link", { name: /zobacz szczeg/i }).click();
    await waitForMeasurementPage(page, "room-details");
  });

  await expect(page).toHaveURL(/\/rooms\/.+/);
  await expect(
    page.getByRole("heading", { name: "Sala A-101" }),
  ).toBeVisible();
  await expect(page.getByLabel(/nazwa rezerwacji/i)).toBeVisible();

  await measureStep(testInfo, page, "reservations-list-ready", async () => {
    await page.goto("/reservations");
    await waitForMeasurementPage(page, "reservations");
  });

  const reservationsPage = page.locator(
    '[data-measurement-page="reservations"]',
  );
  await expect(reservationsPage).toHaveAttribute(
    "data-measurement-count",
    String(expectedCount(testInfo, "reservationCount")),
  );
  await expect(page.getByText(/\[MEASUREMENT\]/i).first()).toBeVisible();
});
