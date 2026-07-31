import { expect, test } from "@playwright/test";
import {
  measureStep,
  waitForUi,
} from "./measurement-utils";

test("read-only user flow", async ({ page }, testInfo) => {
  await measureStep(testInfo, "dashboard-ready", async () => {
    await page.goto("/");
    await waitForUi(page);

    // Dopasuj tekst do identycznego elementu w obu aplikacjach.
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible();

    // Element potwierdzający, że dane API zostały załadowane.
    await expect(
      page.getByText(/aktywne sale/i).first(),
    ).toBeVisible();
  });

  await measureStep(testInfo, "rooms-list-ready", async () => {
    await page.goto("/rooms");

    await expect(
      page.getByRole("heading", { name: /sale/i }),
    ).toBeVisible();

    // Przy seedzie pomiarowym powinny pojawić się konkretne sale.
    await expect(
      page.getByText("Sala A-101", { exact: true }),
    ).toBeVisible();
  });

  await measureStep(testInfo, "room-details-ready", async () => {
    const roomCard = page.locator("article").filter({
      has: page.getByRole("heading", {
        name: "Sala A-101",
        exact: true,
      }),
    });

    await roomCard
      .getByRole("link", { name: /zobacz szczeg/i })
      .click();

    await expect(page).toHaveURL(/\/rooms\/.+/);

    await expect(
      page.getByRole("heading", { name: "Sala A-101" }),
    ).toBeVisible();

    await expect(
      page.getByLabel(/nazwa rezerwacji/i),
    ).toBeVisible();
  });

  await measureStep(testInfo, "reservations-list-ready", async () => {
    await page.goto("/reservations");

    await expect(
      page.getByRole("heading", { name: /moje rezerwacje/i }),
    ).toBeVisible();

    await expect(
      page.getByText(/\[MEASUREMENT\]/i).first(),
    ).toBeVisible();
  });
});
