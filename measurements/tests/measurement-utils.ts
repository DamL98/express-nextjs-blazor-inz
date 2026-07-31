import { test, type Page, type TestInfo } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

export type StepMeasurement = {
  framework: string;
  cacheMode: string;
  test: string;
  step: string;
  durationMs: number;
  timestamp: string;
};

export async function measureStep(
  testInfo: TestInfo,
  stepName: string,
  action: () => Promise<void>,
): Promise<void> {
  const startedAt = performance.now();

  await test.step(stepName, async () => {
    await action();
  });

  const durationMs = performance.now() - startedAt;

  const measurement: StepMeasurement = {
    framework: String(
      testInfo.project.metadata.framework ?? testInfo.project.name,
    ),
    cacheMode: String(
      testInfo.project.metadata.cacheMode ?? "unspecified",
    ),
    test: testInfo.title,
    step: stepName,
    durationMs: Number(durationMs.toFixed(2)),
    timestamp: new Date().toISOString(),
  };

  const outputDirectory = path.resolve(
    process.cwd(),
    "results",
    "raw",
    testInfo.project.name,
  );

  await fs.mkdir(outputDirectory, { recursive: true });

  const safeTitle = testInfo.title
    .replace(/[^a-z0-9-_]+/gi, "-")
    .toLowerCase();

  const outputFile = path.join(
    outputDirectory,
    `${safeTitle}-${testInfo.repeatEachIndex}.jsonl`,
  );

  await fs.appendFile(
    outputFile,
    `${JSON.stringify(measurement)}\n`,
    "utf8",
  );
}

export async function waitForUi(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
}