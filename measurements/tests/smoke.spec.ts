import { expect, test, assertRuntime, waitForMeasurementPage } from "./test-helpers";

test("aplikacja ma aktywną sesję i właściwy renderer", async ({ page }, info) => {
  await page.goto("/");
  await waitForMeasurementPage(page, "dashboard");

  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  await assertRuntime(page, info);
});
