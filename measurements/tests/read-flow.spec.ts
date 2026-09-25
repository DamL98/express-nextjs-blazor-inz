import {
  test, expect, expectedCount, measureStep, prepareCacheState, openPage,
  waitForCalendar, waitForMeasurementPage,
} from "./test-helpers";
import { roomDetailsLink } from "./view-helpers";

test.beforeEach(async ({ page }, info) => prepareCacheState(page, info));

for (const name of ["dashboard", "rooms", "reservations"] as const) {
  test(`${name}-direct`, async ({ page }, info) => {
    await measureStep(info, page, `${name}-direct`, async () => {
      await openPage(page, name);
    });

    if (name !== "dashboard") {
      const countKey = name === "rooms" ? "roomCount" : "reservationCount";
      await expect(page.locator(`[data-measurement-page="${name}"]`))
        .toHaveAttribute("data-measurement-count", String(expectedCount(info, countKey)));
    }

    if (name === "reservations") await waitForCalendar(page);
  });
}

test("room-details-navigation", async ({ page }, info) => {
  await openPage(page, "rooms");
  const detailsLink = roomDetailsLink(page);

  await measureStep(info, page, "room-details-navigation", async () => {
    await detailsLink.click();
    await waitForMeasurementPage(page, "room-details");
  });

  await expect(page.getByRole("heading", { name: "Sala A-101", exact: true })).toBeVisible();
  await expect(page.getByLabel("Nazwa rezerwacji", { exact: true })).toBeVisible();
});
