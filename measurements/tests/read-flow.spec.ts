import {
  test,
  expect,
  expectedCount,
  measureStep,
  prepareCacheState,
  waitForMeasurementPage,
} from "./test-helpers";

for (const [url, name, countKey] of [
  ["/", "dashboard", ""],
  ["/rooms", "rooms", "roomCount"],
  ["/reservations", "reservations", "reservationCount"],
]) {
  test(name + "-direct", async ({ page }, info) => {
    await prepareCacheState(page, info);
    await measureStep(info, page, name + "-direct", async () => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForMeasurementPage(page, name);
    });
    if (countKey) {
      await expect(
        page.locator('[data-measurement-page="' + name + '"]'),
      ).toHaveAttribute("data-measurement-count", String(expectedCount(info, countKey)));
    }
    if (name === "reservations") {
      await expect(page.locator("[data-measurement-calendar]")).toHaveAttribute(
        "data-measurement-calendar",
        "ready",
      );
    }
  });
}
test("room-details-navigation", async ({ page }, info) => {
  await prepareCacheState(page, info);
  await page.goto("/rooms", { waitUntil: "domcontentloaded" });
  await waitForMeasurementPage(page, "rooms");
  const card = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Sala A-101", exact: true }) });
  await measureStep(info, page, "room-details-navigation", async () => {
    await card.getByRole("link", { name: /zobacz szczeg/i }).click();
    await waitForMeasurementPage(page, "room-details");
  });
  await expect(
    page.getByRole("heading", { name: "Sala A-101", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Nazwa rezerwacji", { exact: true })).toBeVisible();
});
