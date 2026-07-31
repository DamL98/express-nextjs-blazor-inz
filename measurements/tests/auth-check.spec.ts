import { expect, test } from "@playwright/test";

test("użytkownik ma aktywną sesję", async ({ page }) => {
  await page.goto("/");

  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: /dashboard/i }),
  ).toBeVisible();
});