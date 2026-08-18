import { expect, test } from "@playwright/test";
import { waitForMeasurementPage } from "./measurement-utils";

test("użytkownik ma aktywną sesję", async ({ page }) => {
  await page.goto("/");
  await waitForMeasurementPage(page, "dashboard");

  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: /dashboard/i }),
  ).toBeVisible();
});
