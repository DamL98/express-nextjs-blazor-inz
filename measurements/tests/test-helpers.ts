import { expect, test, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { protocolVersion, safeId } from "../measurement-config";

export { test, expect };
const views = {
  dashboard: "/",
  rooms: "/rooms",
  reservations: "/reservations"
} as const;
type View = keyof typeof views | "room-details";
type ProjectContext = {
  project: {
    metadata: TestInfo["project"]["metadata"]
  }
};
type StepMeasurement = {
  step: string;
  durationMs: number;
  runtime: string;
  timestamp: string
};

const measurementsByTest = new Map<TestInfo, StepMeasurement[]>();

// Zapis po zakończeniu testu
test.afterEach(async ({ browser }, info) => {
  const steps = measurementsByTest.get(info) ?? [];
  measurementsByTest.delete(info);

  if (process.env.MEASUREMENT_RECORD_RESULTS !== "true") return;

  const runId = safeId(process.env.MEASUREMENT_RUN_ID!);
  const sampleIndex = Number(process.env.MEASUREMENT_SAMPLE_INDEX);
  const directory = path.resolve("results/raw", runId, info.project.name);
  const filename = `${info.title.replace(/[^a-z0-9-]/gi, "-")}-${sampleIndex}.json`;

  const record = {
    browserVersion: browser.version(), protocolVersion, runId,
    project: info.project.name, ...info.project.metadata, sampleIndex,
    test: info.title, status: info.status, retry: info.retry, error: info.error?.message, steps,
  };

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), JSON.stringify(record, null, 2), { flag: "wx" });
});

export async function assertRuntime(page: Page, info: ProjectContext) {
  if (info.project.metadata.framework !== "blazor") return "react-client";

  const renderer = page.locator("[data-measurement-renderer]").last();

  await expect(renderer).toHaveAttribute("data-measurement-renderer", "WebAssembly");
  await expect(renderer).toHaveAttribute("data-measurement-interactive", "true");

  return "webassembly";
}

// Sprawdzenie renderera i zapis wyniku nie należą do mierzonej akcji.
export async function measureStep(info: TestInfo, page: Page, step: string, action: () => Promise<void>) {
  const startedAt = performance.now();

  await action();

  const durationMs = performance.now() - startedAt;
  const runtime = await assertRuntime(page, info);
  const measurements = measurementsByTest.get(info) ?? [];

  measurements.push({ step, durationMs, runtime, timestamp: new Date().toISOString() });
  measurementsByTest.set(info, measurements);
}

export async function waitForMeasurementPage(page: Page, name: View) {
  const pageRoot = page.locator(`[data-measurement-page="${name}"]`);

  await expect(pageRoot).toBeVisible();
  await expect(pageRoot).toHaveAttribute("data-measurement-state", "ready");

  if (name === "dashboard") {
    const calendar = pageRoot.locator("[data-measurement-reservation-calendar]");
    await expect(calendar).toBeVisible();
    await expect(calendar).toHaveAttribute("data-measurement-reservation-calendar", "ready");
  }

  return pageRoot;
}

export async function openPage(page: Page, name: Exclude<View, "room-details">) {
  await page.goto(views[name], { waitUntil: "domcontentloaded" });
  return waitForMeasurementPage(page, name);
}

export async function waitForCalendar(page: Page) {
  await expect(page.locator("[data-measurement-calendar]")).toHaveAttribute("data-measurement-calendar", "ready");
}

export function expectedCount(info: ProjectContext, key: "roomCount" | "reservationCount") {
  const count = Number(info.project.metadata[key]);
  if (!Number.isInteger(count)) throw new Error(`Nieprawidłowa liczebność w metadanych: ${key}`);

  return count;
}

export async function prepareCacheState(page: Page, info: ProjectContext) {
  if (info.project.metadata.cacheMode !== "warm-return") return;

  for (const name of ["dashboard", "rooms", "reservations"] as const) {
    await openPage(page, name);
    if (name === "reservations") await waitForCalendar(page);
  }

  await assertRuntime(page, info);
  await page.goto("about:blank");
}
