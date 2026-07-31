import { expect, test } from "@playwright/test";
import { measureStep } from "./measurement-utils";

function toDateTimeLocal(date: Date): string {
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return local.toISOString().slice(0, 16);
}

test("create and cancel reservation", async ({ page }, testInfo) => {
  const uniqueSuffix = `${testInfo.project.name}-${Date.now()}`;

  const title = `[TEST-RUN] ${uniqueSuffix}`;

  // Termin powinien być wystarczająco odległy i zmieniać się
  // między powtórzeniami, żeby unikać konfliktów.
  const offsetDays = 30 + testInfo.repeatEachIndex;
  const start = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

  start.setHours(10, 0, 0, 0);

  const end = new Date(start);
  end.setHours(11, 0, 0, 0);

  await page.goto("/rooms");

  await page.getByText("Sala A-101", { exact: true }).first().click();

  await measureStep(testInfo, "create-reservation", async () => {
    await page.getByLabel(/tytuł|tytul/i).fill(title);

    const description = page.getByLabel(/opis/i);
    if (await description.count()) {
      await description.fill("Automatyczny pomiar Playwright.");
    }

    await page
      .getByLabel(/rozpoczęcia|rozpoczecia/i)
      .fill(toDateTimeLocal(start));

    await page
      .getByLabel(/zakończenia|zakonczenia/i)
      .fill(toDateTimeLocal(end));

    await page
      .getByRole("button", {
        name: /zarezerwuj|utwórz rezerwację|utworz rezerwacje/i,
      })
      .click();

    await expect(
      page.getByText(/rezerwacja została utworzona|utworzono rezerwację/i),
    ).toBeVisible();
  });

  await measureStep(testInfo, "new-reservation-visible", async () => {
    await page.goto("/reservations");
    await expect(page.getByText(title)).toBeVisible();
  });

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  await measureStep(testInfo, "cancel-reservation", async () => {
    const reservationContainer = page
      .locator("article, li, div")
      .filter({ hasText: title })
      .first();

    await reservationContainer
      .getByRole("button", { name: /anuluj/i })
      .click();

    await expect(
      reservationContainer.getByText(/cancelled|anulowana/i),
    ).toBeVisible();
  });
});