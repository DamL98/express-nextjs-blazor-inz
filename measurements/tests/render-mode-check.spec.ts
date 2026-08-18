import { expect, test } from "@playwright/test";
import {
  prepareCacheState,
  waitForMeasurementPage,
} from "./measurement-utils";

test("Blazor Interactive Auto render mode", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.metadata.framework !== "blazor",
    "Test dotyczy tylko Blazor Interactive Auto.",
  );

  await prepareCacheState(page, testInfo);
  await page.goto("/");
  await waitForMeasurementPage(page, "dashboard");

  const renderer = page.locator("[data-measurement-renderer]").last();
  const cacheMode = String(testInfo.project.metadata.cacheMode);
  const expectedRenderer = cacheMode === "warm-return"
    ? /webassembly/i
    : /server/i;

  await expect(renderer).toHaveAttribute(
    "data-measurement-renderer",
    expectedRenderer,
  );
  await expect(renderer).toHaveAttribute(
    "data-measurement-interactive",
    /true/i,
  );
});
