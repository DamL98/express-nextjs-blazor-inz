import { expect, test, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { protocolVersion, safeId } from "../measurement-config";

export { test, expect };
export type StepMeasurement = {
  step: string;
  durationMs: number;
  runtime: string;
  timestamp: string;
};
const pending = new Map<TestInfo, StepMeasurement[]>();

// Kroki trafiają do pliku dopiero po zakończeniu całego testu. Jeśli test się
// nie powiedzie, zapisane częściowe kroki pozostają materiałem diagnostycznym.
test.afterEach(async ({ browser }, info) => {
  const measuredSteps = pending.get(info) ?? [];
  pending.delete(info);

  if (process.env.MEASUREMENT_RECORD_RESULTS !== "true") {
    return;
  }

  const runId = safeId(process.env.MEASUREMENT_RUN_ID!);
  const sampleIndex = Number(process.env.MEASUREMENT_SAMPLE_INDEX);
  const directory = path.resolve("results/raw", runId, info.project.name);
  await fs.mkdir(directory, { recursive: true });

  const record = {
    browserVersion: browser.version(),
    protocolVersion,
    runId,
    project: info.project.name,
    ...info.project.metadata,
    sampleIndex,
    test: info.title,
    status: info.status,
    retry: info.retry,
    error: info.error?.message,
    steps: measuredSteps,
  };

  const filename = info.title.replace(/[^a-z0-9-]/gi, "-") + "-" + sampleIndex + ".json";

  await fs.writeFile(path.join(directory, filename), JSON.stringify(record, null, 2), {
    flag: "wx",
  });
});

// Potwierdza renderer używany przez testowany frontend i zwraca jego nazwę do
// wyniku kroku. Dla Blazora sprawdza też, czy WebAssembly jest interaktywny
export async function assertRuntime(page: Page, info: TestInfo) {
  if (info.project.metadata.framework !== "blazor") {
    return "react-client";
  }

  const marker = page.locator("[data-measurement-renderer]").last();
  await expect(marker).toHaveAttribute("data-measurement-renderer", "WebAssembly");
  await expect(marker).toHaveAttribute("data-measurement-interactive", "true");

  return "webassembly";
}

// Mierzy wyłącznie przekazaną akcję.
// Sprawdzenie renderera odbywa się po zatrzymaniu stopera,
// a gotowy krok czeka w pamięci do końca testu.
export async function measureStep(
  info: TestInfo,
  page: Page,
  step: string,
  action: () => Promise<void>,
) {
  const start = performance.now();
  await action();
  const durationMs = performance.now() - start;
  const runtime = await assertRuntime(page, info);
  const entries = pending.get(info) ?? [];

  entries.push({
    step,
    durationMs,
    runtime,
    timestamp: new Date().toISOString(),
  });

  pending.set(info, entries);
}

// Czeka, aż wskazana strona będzie widoczna i zgłosi stan gotowości ustawiany
// przez frontend po zakończeniu pobierania oraz renderowania danych.
export async function waitForMeasurementPage(page: Page, name: string) {
  const root = page.locator('[data-measurement-page="' + name + '"]');
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("data-measurement-state", "ready");

  return root;
}

// Pobiera oczekiwaną liczebność datasetu z metadanych Playwright.
export function expectedCount(info: TestInfo, key: string) {
  const value = Number(info.project.metadata[key]);
  if (!Number.isInteger(value)) {
    throw new Error("Nieprawidłowa liczebność w metadanych: " + key);
  }

  return value;
}

// Dla wariantu warm-return odwiedza wcześniej główne widoki w tym samym
// kontekście przeglądarki. Następny pomiar korzysta dzięki temu z cache zasobów.
export async function prepareCacheState(page: Page, info: TestInfo) {
  if (info.project.metadata.cacheMode !== "warm-return") {
    return;
  }

  for (const [url, name] of [
    ["/", "dashboard"],
    ["/rooms", "rooms"],
    ["/reservations", "reservations"],
  ]) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await waitForMeasurementPage(page, name);

    if (name === "reservations") {
      await expect(page.locator("[data-measurement-calendar]")).toHaveAttribute(
        "data-measurement-calendar",
        "ready",
      );
    }
  }
  await assertRuntime(page, info);
  await page.goto("about:blank");
}
