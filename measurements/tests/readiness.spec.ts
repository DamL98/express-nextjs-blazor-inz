import { test, expect, prepareCacheState, waitForMeasurementPage } from "./test-helpers";
import type { TestInfo } from "@playwright/test";

// Testy warunków pomiaru na kontrolowanym DOM, bez API i zapisanej sesji
test.use({ storageState: { cookies: [], origins: [] } });

for (const state of ["loading", "error"]) {
  test(`dashboard nie jest gotowy, gdy kalendarz ma stan ${state}`, async ({ page }) => {
    await page.setContent(`
      <main data-measurement-page="dashboard" data-measurement-state="ready">
        Podsumowanie
        <section data-measurement-reservation-calendar="${state}">Kalendarz</section>
      </main>
    `);

    let finished = false;
    const waiting = waitForMeasurementPage(page, "dashboard").then(() => {
      finished = true;
    });
    // Dajemy czas na wykrycie gotowego podsumowania. Samo podsumowanie
    // nie może zakończyć oczekiwania
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(finished).toBe(false);

    await page.locator("[data-measurement-reservation-calendar]").evaluate((element) => {
      element.setAttribute("data-measurement-reservation-calendar", "ready");
    });
    await waiting;
    expect(finished).toBe(true);
  });
}

test("warm-return nie opuszcza dashboardu przed gotowością kalendarza", async ({
  page,
}) => {
  const visited: string[] = [];
  await page.route("http://localhost:3100/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    visited.push(path);
    const name = path === "/" ? "dashboard" : path.slice(1);
    const panel =
      path === "/"
        ? '<section data-measurement-reservation-calendar="loading">Kalendarz</section>'
        : path === "/reservations"
          ? '<section data-measurement-calendar="ready">Integracja</section>'
          : "";
    await route.fulfill({
      contentType: "text/html",
      body: `<main data-measurement-page="${name}" data-measurement-state="ready">Dane ${panel}</main>`,
    });
  });

  const info = {
    project: { metadata: { cacheMode: "warm-return", framework: "next" } },
  } as TestInfo;
  const warming = prepareCacheState(page, info);
  await expect(page.locator("[data-measurement-reservation-calendar]")).toBeVisible();
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(visited).toEqual(["/"]);

  await page.locator("[data-measurement-reservation-calendar]").evaluate((element) => {
    element.setAttribute("data-measurement-reservation-calendar", "ready");
  });
  await warming;
  expect(visited).toEqual(["/", "/rooms", "/reservations"]);
  expect(page.url()).toBe("about:blank");
});
