import { defineConfig } from "@playwright/test";

const datasets = [
  { name: "small", roomCount: 10, reservationCount: 15 },
  { name: "medium", roomCount: 50, reservationCount: 200 },
  { name: "large", roomCount: 100, reservationCount: 400 },
] as const;

const frameworks = [
  {
    name: "next",
    baseURL: "http://localhost:3000",
    storageState: "playwright/.auth/next-user.json",
  },
  {
    name: "blazor",
    baseURL: "http://localhost:5173",
    storageState: "playwright/.auth/blazor-user.json",
  },
] as const;

const projects = datasets.flatMap((dataset) =>
  frameworks.flatMap((framework) => [
    {
      name: `${framework.name}-${dataset.name}`,
      use: {
        baseURL: framework.baseURL,
        storageState: framework.storageState,
      },
      metadata: {
        framework: framework.name,
        dataset: dataset.name,
        cacheMode: "fresh-context",
        roomCount: dataset.roomCount,
        reservationCount: dataset.reservationCount,
      },
    },
    {
      name: `${framework.name}-${dataset.name}-warm`,
      use: {
        baseURL: framework.baseURL,
        storageState: framework.storageState,
      },
      metadata: {
        framework: framework.name,
        dataset: dataset.name,
        cacheMode: "warm-return",
        roomCount: dataset.roomCount,
        reservationCount: dataset.reservationCount,
      },
    },
  ]),
);

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },

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
    locale: "pl-PL",
    timezoneId: "Europe/Warsaw",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
  },

  projects,
});
