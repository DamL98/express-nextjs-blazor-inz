import { test, expect, prepareCacheState, waitForMeasurementPage } from "./test-helpers";
import type { Page } from "@playwright/test";

// Kontrolowany DOM: te testy nie wymagają API ani zapisanej sesji.
test.use({ storageState: { cookies: [], origins: [] } });

const calendarSelector = "[data-measurement-reservation-calendar]";
const calendarPanel = '<section data-measurement-reservation-calendar="loading">Kalendarz</section>';

async function finishCalendarLoading(page: Page) {
  await page.locator(calendarSelector).evaluate((calendar) => {
    calendar.setAttribute("data-measurement-reservation-calendar", "ready");
  });
}

for (const state of ["loading", "error"]) {
  test(`dashboard nie jest gotowy, gdy kalendarz ma stan ${state}`, async ({ page }) => {
    await page.setContent(`
      <main data-measurement-page="dashboard" data-measurement-state="ready">
        ${calendarPanel.replace("loading", state)}
      </main>`);

    let finished = false;
    const waiting = waitForMeasurementPage(page, "dashboard").then(() => { finished = true; });

    // Krótka obserwacja negatywna: gotowe podsumowanie nie wystarcza.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(finished).toBe(false);
    await finishCalendarLoading(page);
    await waiting;
    expect(finished).toBe(true);
  });
}

test("warm-return nie opuszcza dashboardu przed gotowością kalendarza", async ({ page }) => {
  const visited: string[] = [];
  const panels: Record<string, string> = {
    "/": calendarPanel,
    "/reservations": '<section data-measurement-calendar="ready">Integracja</section>',
  };

  await page.route("http://localhost:3100/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    visited.push(pathname);
    const name = pathname === "/" ? "dashboard" : pathname.slice(1);

    await route.fulfill({
      contentType: "text/html",
      body: `<main data-measurement-page="${name}" data-measurement-state="ready">Dane ${panels[pathname] ?? ""}</main>`,
    });
  });

  const warming = prepareCacheState(page, {
    project: { metadata: { cacheMode: "warm-return", framework: "next" } },
  });

  await expect(page.locator(calendarSelector)).toBeVisible();
  await new Promise((resolve) => setTimeout(resolve, 200));

  expect(visited).toEqual(["/"]);

  await finishCalendarLoading(page);
  await warming;

  expect(visited).toEqual(["/", "/rooms", "/reservations"]);
  expect(page.url()).toBe("about:blank");
});
