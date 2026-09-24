import path from "node:path";
import { fileURLToPath } from "node:url";

export const measurementsDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryDirectory = path.resolve(measurementsDirectory, "..");

export const measurementDatabaseUrl =
  "postgresql://measurement:local-measurement-only@localhost:5434/inz_measurements";
export const authStateFile = "playwright/.auth/user.json";

export const protocolVersion = 3;

export const frameworkRuntime = {
  next: "react-client",
  blazor: "webassembly",
} as const;

export const datasets = [
  { name: "small", roomCount: 10, reservationCount: 15 },
  { name: "medium", roomCount: 50, reservationCount: 200 },
  { name: "large", roomCount: 100, reservationCount: 400 },
] as const;

export const frameworks = [
  {
    name: "next",
    baseURL: "http://localhost:3100",
    storageState: authStateFile,
    runtime: frameworkRuntime.next,
  },
  {
    name: "blazor",
    baseURL: "http://localhost:5177",
    storageState: authStateFile,
    runtime: frameworkRuntime.blazor,
  },
] as const;

export const flows = ["read", "write"] as const;
export const cacheModes = ["fresh-context", "warm-return"] as const;

export const steps = {
  read: [
    "dashboard-direct",
    "rooms-direct",
    "reservations-direct",
    "room-details-navigation",
  ],
  write: ["create-reservation", "new-reservation-visible", "cancel-reservation"],
} as const;

export const urls = {
  next: frameworks[0].baseURL,
  blazor: frameworks[1].baseURL,
  api: "http://localhost:4100/api/v1",
};

export type Dataset = (typeof datasets)[number]["name"];
export type Framework = (typeof frameworks)[number]["name"];
export type Flow = (typeof flows)[number];
export type CacheMode = (typeof cacheModes)[number];

export function projectName(
  framework: Framework,
  dataset: Dataset,
  cacheMode: CacheMode,
): string {
  const warmSuffix = cacheMode === "warm-return" ? "-warm" : "";
  return `${framework}-${dataset}${warmSuffix}`;
}

export function safeId(value: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error("Identyfikator może zawierać tylko litery, cyfry, _ oraz -.");
  }

  return value;
}
