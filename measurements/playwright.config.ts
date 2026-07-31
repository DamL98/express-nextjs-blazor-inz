import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,

  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "results/playwright/report",
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
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "next-small",
      use: {
        baseURL: "http://localhost:3000",
        storageState: "playwright/.auth/next-user.json",
      },
      metadata: {
        framework: "next",
        dataset: "small",
        cacheMode: "cold",
      },
    },
    {
      name: "blazor-small",
      use: {
        baseURL: "http://localhost:5173",
        storageState: "playwright/.auth/blazor-user.json",
      },
      metadata: {
        framework: "blazor",
        dataset: "small",
        cacheMode: "cold",
      },
    },
    {
      name: "next-large",
      use: {
        baseURL: "http://localhost:3000",
        storageState: "playwright/.auth/next-user.json",
      },
      metadata: {
        framework: "next",
        dataset: "large",
        cacheMode: "cold",
      },
    },
    {
      name: "blazor-large",
      use: {
        baseURL: "http://localhost:5173",
        storageState: "playwright/.auth/blazor-user.json",
      },
      metadata: {
        framework: "blazor",
        dataset: "large",
        cacheMode: "cold",
      },
    },
  ],
});