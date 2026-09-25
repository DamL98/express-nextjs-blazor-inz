import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  cacheModes, datasets, flows, frameworks, measurementDatabaseUrl, measurementsDirectory,
  projectName, protocolVersion, repositoryDirectory, safeId, type Framework,
} from "../measurement-config";
import { argument, choiceArgument, integerArgument, readJson, writeJson, runCommand, runTypeScript } from "./cli";
import { checkServices, checkSession, checkDataset } from "./preflight";

function readConfiguration() {
  if (process.env.MEASUREMENT_DIAGNOSTIC === "true") {
    throw new Error("Tryb diagnostyczny nie może zapisywać wyników pomiarowych");
  }

  const flow = choiceArgument("flow", "read", flows);
  const dataset = choiceArgument("dataset", "small", datasets.map((item) => item.name));
  const cacheMode = choiceArgument("cache", "fresh-context", cacheModes);
  const timestamp = new Date().toISOString().replace(/[^a-z0-9]/gi, "-");

  return {
    flow, dataset, cacheMode,
    repetitions: integerArgument("repetitions", 30, 2),
    warmups: integerArgument("warmups", 3, 1),
    runId: safeId(argument("run-id", `${flow}-${dataset}-${cacheMode}-${timestamp}`)!),
    prepareDataset: choiceArgument("prepare-dataset", "false", ["true", "false"]) === "true",
  };
}

const configuration = readConfiguration();
const { flow, dataset, cacheMode, repetitions, warmups, runId } = configuration;
const outputDirectory = path.join(measurementsDirectory, "results/raw", runId);
const playwrightDirectory = path.join(measurementsDirectory, "node_modules/@playwright/test");

function capture(command: string, args: string[]) {
  return execFileSync(command, args, {
    cwd: repositoryDirectory,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

// tw. podsumowania systemu i sprzetu
function createManifest(services: Awaited<ReturnType<typeof checkServices>>, email: string) {
  return {
    protocolVersion,
    configuration,
    services,
    measurementUser: email,
    startedAt: new Date().toISOString(),
    finishedAt: undefined as string | undefined,
    status: "running", node: process.version,
    dotnet: capture("dotnet", ["--version"]),
    commit: capture("git", ["rev-parse", "HEAD"]),
    dirtyFiles: capture("git", ["status", "--short"]),
    system: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      ramBytes: os.totalmem(),
    },
    network: "localhost-unthrottled",
    playwright: readJson(path.join(playwrightDirectory, "package.json")).version,
  };
}

// seed w kazdym przypadku dostaje adres bazy do testów
function resetDataset(email: string) {
  runCommand(process.execPath, [`prisma/seed.measurements.${dataset}.js`], {
    cwd: path.join(repositoryDirectory, "backend"),
    env: {
      ...process.env,
      DATABASE_URL: measurementDatabaseUrl,
      DIRECT_URL: measurementDatabaseUrl,
      MEASUREMENT_USER_EMAIL: email,
      MEASUREMENT_STRICT_DATASET: "true",
    },
  });
}

function runBrowserTests(framework: Framework, sampleIndex: number, record: boolean) {
  const project = projectName(framework, dataset, cacheMode);

  runCommand(process.execPath, [
    path.join(playwrightDirectory, "cli.js"),
    "test", `tests/${flow}-flow.spec.ts`, `--project=${project}`,
  ], {
    env: {
      ...process.env,
      MEASUREMENT_RUN_ID: runId,
      MEASUREMENT_SAMPLE_INDEX: String(sampleIndex),
      MEASUREMENT_RECORD_RESULTS: String(record),
      MEASUREMENT_REPORT_DIR: path.join(outputDirectory, "reports", `${framework}-${sampleIndex}`),
    },
  });
}

// testy mierzone są zamienianie kolejnością AB/BA nextjs/blazor blazor/nextjs
// testy warmup mają stałą kolejność
function runRound(email: string, sampleIndex: number, record: boolean) {
  const order = frameworks.map((framework) => framework.name);
  if (record && sampleIndex % 2 !== 0) order.reverse();

  for (const framework of order) {
    if (flow === "write") resetDataset(email);
    runBrowserTests(framework, sampleIndex, record);
  }
}

async function main() {
  if (fs.existsSync(outputDirectory)) throw new Error(`Run ID ${runId} już istnieje.`);

  const services = await checkServices();
  const email = await checkSession();

  if (flow === "write" || configuration.prepareDataset) resetDataset(email);
  await checkDataset(dataset);

  fs.mkdirSync(outputDirectory, { recursive: true });

  const manifest = createManifest(services, email);
  const manifestFile = path.join(outputDirectory, "manifest.json");
  writeJson(manifestFile, manifest);

  try {
    for (let index = 0; index < warmups; index++) runRound(email, -index - 1, false);
    for (let index = 0; index < repetitions; index++) runRound(email, index, true);
    runTypeScript("scripts/summarize-results.ts", [`--run-id=${runId}`]);
    manifest.status = "complete";
  } catch (error) {
    manifest.status = "failed";
    throw error;
  } finally {
    // awaria czyszczenia pomiarow zapisuje tez koncowy status
    try {
      if (flow === "write") resetDataset(email);
    } catch (error) {
      manifest.status = "failed";
      throw error;
    } finally {
      manifest.finishedAt = new Date().toISOString();
      writeJson(manifestFile, manifest);
    }
  }
}

await main();
