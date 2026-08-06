import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const measurementsDirectory = path.resolve(scriptDirectory, "..");
const repositoryDirectory = path.resolve(measurementsDirectory, "..");

function command(executable, args, cwd = repositoryDirectory) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });

  return result.status === 0 ? result.stdout.trim() : null;
}

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const chromiumPath = chromium.executablePath();
const browser = await chromium.launch();
const chromiumVersion = browser.version();
await browser.close();
const npmVersion = process.env.npm_execpath
  ? command(process.execPath, [process.env.npm_execpath, "--version"])
  : null;
const runId = argument("run-id", "environment");
const timestamp = new Date().toISOString();
const report = {
  runId,
  capturedAt: timestamp,
  git: {
    branch: command("git", ["branch", "--show-current"]),
    commit: command("git", ["rev-parse", "HEAD"]),
    isDirty: Boolean(command("git", ["status", "--porcelain"])),
  },
  operatingSystem: {
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    hostname: os.hostname(),
  },
  hardware: {
    cpuModel: os.cpus()[0]?.model ?? null,
    logicalCpuCount: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
  },
  runtime: {
    node: process.version,
    npm: npmVersion,
    dotnet: command("dotnet", ["--version"]),
    chromiumPath,
    chromiumVersion,
  },
  measurementConfiguration: {
    viewport: "1366x768",
    locale: "pl-PL",
    timezone: "Europe/Warsaw",
    workers: 1,
    headless: true,
  },
};

const outputDirectory = path.join(
  measurementsDirectory,
  "results",
  "environment",
);
const safeRunId = runId.replace(/[^a-z0-9-_]+/gi, "-");

fs.mkdirSync(outputDirectory, { recursive: true });
const outputFile = path.join(outputDirectory, `${safeRunId}.json`);
fs.writeFileSync(outputFile, JSON.stringify(report, null, 2), "utf8");

console.log(`Zapisano opis srodowiska: ${outputFile}`);
console.log(report);
