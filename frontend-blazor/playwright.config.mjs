import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  outputDir: "./test-results/parity",
  webServer: process.env.BLAZOR_TEST_URL ? undefined : {
    command: "dotnet run --project FrontendBlazor/FrontendBlazor.csproj --no-build --no-launch-profile",
    url: "http://localhost:5188/login",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      ASPNETCORE_URLS: "http://localhost:5188",
      ASPNETCORE_ENVIRONMENT: "Development",
      DOTNET_ENVIRONMENT: "Development",
      Measurement__UseEphemeralDataProtection: "true",
    },
  },
  use: {
    browserName: "chromium",
    timezoneId: "Europe/Warsaw",
    locale: "pl-PL",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
});
