import fs from "node:fs";
import path from "node:path";
import {
  getArgument,
  getIntegerArgument,
  measurementsDirectory,
  repositoryDirectory,
  runCommand,
} from "./script-utils";

type Flow = "read" | "write";
type Dataset = "small" | "medium" | "large";
type CacheMode = "fresh-context" | "warm-return";
type Framework = "next" | "blazor";

type MeasurementConfiguration = {
  flow: Flow;
  dataset: Dataset;
  cacheMode: CacheMode;
  repetitions: number;
  warmups: number;
  runId: string;
};

type PlaywrightRun = MeasurementConfiguration & {
  framework: Framework;
  sampleIndex: number;
  recordResults: boolean;
  repeatEach?: number;
};

const backendDirectory = path.join(
  repositoryDirectory,
  "backend"
);

const playwrightCli = path.join(
  measurementsDirectory,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);

const tsxCli = path.join(
  measurementsDirectory,
  "node_modules",
  "tsx",
  "dist",
  "cli.mjs",
);

/** sprawdza argument tekstowy względem dozwolonych wartości pomiarowych */
function readChoice<T extends string>(
  name: string,
  fallback: T,
  allowedValues: readonly T[],
): T {
  const value = getArgument(name, fallback) as T;

  if (!allowedValues.includes(value)) {
    throw new Error(
      `Parametr --${name} musi mieć wartość: ${allowedValues.join(", ")}.`,
    );
  }

  return value;
}

/** tworzy id używane w nazwach folderów i raportów */
function createRunId(flow: Flow, dataset: Dataset, cacheMode: CacheMode): string {
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  return `${flow}-${dataset}-${cacheMode}-${timestamp}`;
}

/** buduje config pomiarów na podstawie argumentów przekazanych do skryptu npm */
function readMeasurementConfiguration(): MeasurementConfiguration {
  const flow = readChoice("flow", "read", ["read", "write"]);
  const dataset = readChoice("dataset", "small", ["small", "medium", "large"]);
  const cacheMode = readChoice("cache", "fresh-context", [
    "fresh-context",
    "warm-return",
  ]);
  const repetitions = getIntegerArgument("repetitions", 30, 1);
  const warmups = getIntegerArgument("warmups", 3);
  const runId = getArgument(
    "run-id",
    createRunId(flow, dataset, cacheMode),
  )!;

  return { flow, dataset, cacheMode, repetitions, warmups, runId };
}

/** uruchamia seed backendu przed pomiarami wymagającymi konkretnego rozmiaru danych */
function seedDatabase(dataset: Dataset): void {
  console.log(`\n[seed] Przygotowanie datasetu ${dataset}`);

  runCommand(process.execPath, [`prisma/seed.measurements.${dataset}.js`], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      MEASUREMENT_STRICT_DATASET: "true",
    },
  });
}

/** zwraca nazwę projektu z playwright.config.ts dla wybranego wariantu pomiaru */
function getProjectName(
  framework: Framework,
  dataset: Dataset,
  cacheMode: CacheMode,
): string {
  const suffix = cacheMode === "warm-return" ? "-warm" : "";
  return `${framework}-${dataset}${suffix}`;
}

/** uruchamia pojedynczą serię testu Playwright i przekazuje jej metadane przez zmienne środowiskowe */
function runPlaywright(configuration: PlaywrightRun): void {
  const {
    flow,
    framework,
    dataset,
    cacheMode,
    runId,
    sampleIndex,
    recordResults,
    repeatEach = 1,
  } = configuration;
  const project = getProjectName(framework, dataset, cacheMode);

  console.log(
    `\n[playwright] ${flow}, ${project}, sample=${sampleIndex}, record=${recordResults}`,
  );

  runCommand(
    process.execPath,
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

/** sprawdza czy wymagana usluga przez pomiary odpowiada pod podanym url */
async function checkService(name: string, url: string): Promise<void> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${name} nie odpowiada pod ${url}: ${message}`);
  }
}

/** przed pomiarami sprawdza pliki sesji, Playwright oraz backend/nextjs/blazor */
async function runPreflightChecks(): Promise<void> {
  const requiredFiles = [
    playwrightCli,
    path.join(measurementsDirectory, "playwright", ".auth", "next-user.json"),
    path.join(measurementsDirectory, "playwright", ".auth", "blazor-user.json"),
  ];

  for (const requiredFile of requiredFiles) {
    if (!fs.existsSync(requiredFile)) {
      throw new Error(`Brak wymaganego pliku: ${requiredFile}`);
    }
  }

  await Promise.all([
    checkService("Backend", "http://localhost:4000/api/v1/health"),
    checkService("Next.js", "http://localhost:3000"),
    checkService("Blazor", "http://localhost:5173"),
  ]);
}

/** zmienia kolejność frameworków co próbkę, aby ograniczyć wpływ kolejności na wynik */
function getFrameworkOrder(sampleIndex: number): Framework[] {
  return sampleIndex % 2 === 0
    ? ["next", "blazor"]
    : ["blazor", "next"];
}

/** uruchamia próbki rozgrzewkowe, które nie są zapisywane do wyników końcowych */
function runWarmups(configuration: MeasurementConfiguration): void {
  if (configuration.warmups === 0) {
    return;
  }

  for (const framework of ["next", "blazor"] as const) {
    if (configuration.flow === "write") {
      seedDatabase(configuration.dataset);
    }

    runPlaywright({
      ...configuration,
      framework,
      sampleIndex: -1,
      recordResults: false,
      repeatEach: configuration.warmups,
    });
  }
}

/** uruchamia właściwe próbki dla Next.js i Blazora i zapisuje ich wyniki */
function runMeasuredSamples(configuration: MeasurementConfiguration): void {
  for (
    let sampleIndex = 0;
    sampleIndex < configuration.repetitions;
    sampleIndex += 1
  ) {
    for (const framework of getFrameworkOrder(sampleIndex)) {
      if (configuration.flow === "write") {
        seedDatabase(configuration.dataset);
      }

      runPlaywright({
        ...configuration,
        framework,
        sampleIndex,
        recordResults: true,
      });
    }
  }
}

/** podsumowaie wynikow */
function summarizeResults(runId: string, repetitions: number): void {
  runCommand(process.execPath, [
    tsxCli,
    "scripts/summarize-results.ts",
    `--run-id=${runId}`,
    `--expected-samples=${repetitions}`,
  ]);
}

/** pokazuje config, wykonuje pomiary i generuje raport końcowy */
async function main(): Promise<void> {
  const configuration = readMeasurementConfiguration();

  console.log("Pomiary wydajnościowe");
  console.log(`runId: ${configuration.runId}`);
  console.log(`flow: ${configuration.flow}`);
  console.log(`dataset: ${configuration.dataset}`);
  console.log(`cache: ${configuration.cacheMode}`);
  console.log(`powtórzenia na framework: ${configuration.repetitions}`);
  console.log(`rozgrzewki na framework: ${configuration.warmups}`);

  await runPreflightChecks();
  seedDatabase(configuration.dataset);
  runWarmups(configuration);
  runMeasuredSamples(configuration);

  if (configuration.flow === "write") {
    seedDatabase(configuration.dataset);
  }

  summarizeResults(configuration.runId, configuration.repetitions);
  console.log(`\nPomiary zakończone: ${configuration.runId}`);
}

await main();
