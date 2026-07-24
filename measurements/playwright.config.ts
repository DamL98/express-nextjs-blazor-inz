import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [
    ["list"],
    ["json", { outputFile: "results/playwright/results.json" }],
    ["html", { outputFolder: "results/playwright/html", open: "never" }],
  ],
  use: {
    browserName: "chromium",
    viewport: { width: 1366, height: 768 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "next",
      use: {
        baseURL: "http://localhost:3000",
        storageState: "playwright/.auth/user-next.json",
      },
    },
    {
      name: "blazor",
      use: {
        baseURL: "http://localhost:5173",
        storageState: "playwright/.auth/user-blazor.json",
      },
    },
  ],
});