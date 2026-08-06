import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const measurementsDirectory = path.resolve(scriptDirectory, "..");
const repositoryDirectory = path.resolve(measurementsDirectory, "..");
const backendDirectory = path.join(repositoryDirectory, "backend");
const playwrightCli = path.join(
  measurementsDirectory,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);
const summaryCli = path.join(
  measurementsDirectory,
  "node_modules",
  "tsx",
  "dist",
  "cli.mjs",
);

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const item = process.argv.slice(2).find((value) => value.startsWith(prefix));

  return item ? item.slice(prefix.length) : fallback;
}

function positiveInteger(name, fallback) {
  const value = Number(argument(name, String(fallback)));

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Parametr --${name} musi byc liczba calkowita >= 0.`);
  }

  return value;
}

function createRunId(flow, dataset, cacheMode) {
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  return `${flow}-${dataset}-${cacheMode}-${timestamp}`;
}

function runNode(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: options.cwd ?? measurementsDirectory,
    env: options.env ?? process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Polecenie zakonczylo sie kodem ${result.status}.`);
  }
}

function seed(dataset) {
  console.log(`\n[seed] Przygotowanie datasetu ${dataset}`);
  runNode([`prisma/seed.measurements.${dataset}.js`], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      MEASUREMENT_STRICT_DATASET: "true",
    },
  });
}

function projectName(framework, dataset, cacheMode) {
  const suffix = cacheMode === "warm-return" ? "-warm" : "";
  return `${framework}-${dataset}${suffix}`;
}

function runPlaywright({
  flow,
  framework,
  dataset,
  cacheMode,
  runId,
  sampleIndex,
  recordResults,
  repeatEach = 1,
}) {
  const project = projectName(framework, dataset, cacheMode);
  console.log(
    `\n[playwright] ${flow}, ${project}, sample=${sampleIndex}, record=${recordResults}`,
  );

  runNode(
    [
      playwrightCli,
      "test",
      `tests/${flow}-flow.spec.ts`,
      `--project=${project}`,
      `--repeat-each=${repeatEach}`,
    ],
    {
      env: {
        ...process.env,
        MEASUREMENT_RUN_ID: runId,
        MEASUREMENT_SAMPLE_INDEX: String(sampleIndex),
        MEASUREMENT_RECORD_RESULTS: String(recordResults),
      },
    },
  );
}

async function checkUrl(name, url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(`${name} nie odpowiada pod ${url}: ${error.message}`);
  }
}

async function preflight() {
  const requiredFiles = [
    playwrightCli,
    path.join(measurementsDirectory, "playwright", ".auth", "next-user.json"),
    path.join(measurementsDirectory, "playwright", ".auth", "blazor-user.json"),
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Brak wymaganego pliku: ${file}`);
    }
  }

  await Promise.all([
    checkUrl("Backend", "http://localhost:4000/api/v1/health"),
    checkUrl("Next.js", "http://localhost:3000"),
    checkUrl("Blazor", "http://localhost:5173"),
  ]);
}

function summarize(runId, repetitions) {
  runNode([
    summaryCli,
    "scripts/summarize-results.ts",
    `--run-id=${runId}`,
    `--expected-samples=${repetitions}`,
  ]);
}

const flow = argument("flow", "read");
const dataset = argument("dataset", "small");
const cacheMode = argument("cache", "fresh-context");
const repetitions = positiveInteger("repetitions", 30);
const warmups = positiveInteger("warmups", 3);
const runId = argument(
  "run-id",
  createRunId(flow, dataset, cacheMode),
);

if (!["read", "write"].includes(flow)) {
  throw new Error("--flow musi miec wartosc read albo write.");
}

if (!["small", "medium", "large"].includes(dataset)) {
  throw new Error("--dataset musi miec wartosc small, medium albo large.");
}

if (!["fresh-context", "warm-return"].includes(cacheMode)) {
  throw new Error(
    "--cache musi miec wartosc fresh-context albo warm-return.",
  );
}

if (repetitions < 1) {
  throw new Error("--repetitions musi byc liczba calkowita >= 1.");
}

console.log("Measurement campaign");
console.log(`runId: ${runId}`);
console.log(`flow: ${flow}`);
console.log(`dataset: ${dataset}`);
console.log(`cache: ${cacheMode}`);
console.log(`repetitions per framework: ${repetitions}`);
console.log(`warmups per framework: ${warmups}`);

await preflight();
seed(dataset);

if (warmups > 0) {
  for (const framework of ["next", "blazor"]) {
    if (flow === "write") {
      seed(dataset);
    }

    runPlaywright({
      flow,
      framework,
      dataset,
      cacheMode,
      runId,
      sampleIndex: -1,
      recordResults: false,
      repeatEach: warmups,
    });
  }
}

for (let sampleIndex = 0; sampleIndex < repetitions; sampleIndex += 1) {
  const frameworks = sampleIndex % 2 === 0
    ? ["next", "blazor"]
    : ["blazor", "next"];

  for (const framework of frameworks) {
    if (flow === "write") {
      seed(dataset);
    }

    runPlaywright({
      flow,
      framework,
      dataset,
      cacheMode,
      runId,
      sampleIndex,
      recordResults: true,
    });
  }
}

if (flow === "write") {
  seed(dataset);
}

summarize(runId, repetitions);
console.log(`\nKampania zakonczona: ${runId}`);
