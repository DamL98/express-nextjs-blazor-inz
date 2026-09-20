import { defineConfig } from "@playwright/test";
import { cacheModes, datasets, frameworks, projectName } from "./measurement-config";

const projects = datasets.flatMap((dataset) =>
  frameworks.flatMap((framework) =>
    cacheModes.map((cacheMode) => ({
      name: projectName(framework.name, dataset.name, cacheMode),
      use: {
        baseURL: framework.baseURL,
        storageState: framework.storageState,
      },
      metadata: {
        framework: framework.name,
        dataset: dataset.name,
        cacheMode,
        roomCount: dataset.roomCount,
        reservationCount: dataset.reservationCount,
      },
    })),
  ),
);

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: true,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },

  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: process.env.MEASUREMENT_REPORT_DIR ?? "results/playwright/report",
        open: "never",
      },
    ],
  ],

  use: {
    browserName: "chromium",
    viewport: {
      width: 1366,
      height: 768,
    },
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    trace: process.env.MEASUREMENT_DIAGNOSTIC === "true" ? "retain-on-failure" : "off",
    video: "off",
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },

  projects,
});
