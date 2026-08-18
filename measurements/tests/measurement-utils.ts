import { expect, test, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

export type StepMeasurement = {
  runId: string;
  project: string;
  framework: string;
  dataset: string;
  cacheMode: string;
  runtime: string;
  sampleIndex: number;
  test: string;
  step: string;
  durationMs: number;
  timestamp: string;
};

function metadataValue(testInfo: TestInfo, key: string, fallback: string) {
  return String(testInfo.project.metadata[key] ?? fallback);
}

function safePathPart(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
}

function getRunId() {
  return process.env.MEASUREMENT_RUN_ID ?? "manual-run";
}

function getSampleIndex(testInfo: TestInfo) {
  const configuredIndex = Number(process.env.MEASUREMENT_SAMPLE_INDEX);

  return Number.isInteger(configuredIndex)
    ? configuredIndex
    : testInfo.repeatEachIndex;
}

async function detectRuntime(page: Page, framework: string) {
  if (framework !== "blazor") {
    return "react-client";
  }

  const marker = page.locator("[data-measurement-renderer]").last();
  await marker.waitFor({ state: "attached" });

  return (await marker.getAttribute("data-measurement-renderer"))
    ?.toLowerCase() ?? "unknown";
}

export async function measureStep(
  testInfo: TestInfo,
  page: Page,
  stepName: string,
  action: () => Promise<void>,
): Promise<void> {
  const startedAt = performance.now();

  await test.step(stepName, action);

  const durationMs = performance.now() - startedAt;

  if (process.env.MEASUREMENT_RECORD_RESULTS === "false") {
    return;
  }

  const framework = metadataValue(
    testInfo,
    "framework",
    testInfo.project.name,
  );
  const runId = getRunId();
  const sampleIndex = getSampleIndex(testInfo);
  const measurement: StepMeasurement = {
    runId,
    project: testInfo.project.name,
    framework,
    dataset: metadataValue(testInfo, "dataset", "unspecified"),
    cacheMode: metadataValue(testInfo, "cacheMode", "unspecified"),
    runtime: await detectRuntime(page, framework),
    sampleIndex,
    test: testInfo.title,
    step: stepName,
    durationMs: Number(durationMs.toFixed(2)),
    timestamp: new Date().toISOString(),
  };

  const outputDirectory = path.resolve(
    process.cwd(),
    "results",
    "raw",
    safePathPart(runId),
    testInfo.project.name,
  );

  await fs.mkdir(outputDirectory, { recursive: true });

  const outputFile = path.join(
    outputDirectory,
    `${safePathPart(testInfo.title)}-${sampleIndex}.jsonl`,
  );

  await fs.appendFile(
    outputFile,
    `${JSON.stringify(measurement)}\n`,
    "utf8",
  );
}

export async function waitForMeasurementPage(
  page: Page,
  pageName: string,
) {
  const pageRoot = page.locator(
    `[data-measurement-page="${pageName}"]`,
  );

  await expect(pageRoot).toBeVisible();
  await expect(pageRoot).toHaveAttribute("data-measurement-state", "ready");

  return pageRoot;
}

export function expectedCount(testInfo: TestInfo, key: string) {
  const value = Number(testInfo.project.metadata[key]);

  if (!Number.isInteger(value)) {
    throw new Error(`Brak liczbowej metadanej projektu: ${key}`);
  }

  return value;
}

/**
 * Rozróżnia pierwszą i kolejną wizytę. Kolejna wizyta korzysta z warmed-up kontekstu,
 * w Blazorze dodatkowo przechodzi z trybu renderowania Server na WebAssembly
 */
export async function prepareCacheState(page: Page, testInfo: TestInfo) {
  const cacheMode = metadataValue(testInfo, "cacheMode", "fresh-context");

  if (cacheMode !== "warm-return") {
    return;
  }

  await page.goto("/");
  await waitForMeasurementPage(page, "dashboard");

  await page.goto("/rooms");
  await waitForMeasurementPage(page, "rooms");

  const roomCard = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Sala A-101",
      exact: true,
    }),
  });

  await roomCard.getByRole("link", { name: /zobacz szczeg/i }).click();
  await waitForMeasurementPage(page, "room-details");

  await page.goto("/reservations");
  await waitForMeasurementPage(page, "reservations");

  if (metadataValue(testInfo, "framework", "") === "blazor") {
    let renderer = "unknown";

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await page.waitForTimeout(1_000);
      await page.goto("/");
      await waitForMeasurementPage(page, "dashboard");
      renderer = await detectRuntime(page, "blazor");

      if (renderer.includes("webassembly")) {
        break;
      }
    }

    if (!renderer.includes("webassembly")) {
      throw new Error(
        `Warm-return wymaga renderera WebAssembly, otrzymano: ${renderer}`,
      );
    }
  }

  await page.goto("about:blank");
}
