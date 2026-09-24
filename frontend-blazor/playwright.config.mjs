import { defineConfig } from "../measurements/node_modules/@playwright/test/index.mjs";
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  outputDir: "../measurements/test-results/blazor-parity",
  use: {
    browserName: "chromium",
    timezoneId: "Europe/Warsaw",
    locale: "pl-PL",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
});
