import path from "node:path";
import {
  getArgument,
  getIntegerArgument,
  measurementsDirectory,
  runCommand,
  toSafePathPart,
} from "./script-utils";

const datasets = ["small", "medium", "large"] as const;
const flows = ["read", "write"] as const;
const cacheModes = ["fresh-context", "warm-return"] as const;

const tsxCli = path.join(
  measurementsDirectory,
  "node_modules",
  "tsx",
  "dist",
  "cli.mjs",
);

/** tworzy wspólny prefiks, pozwala rozpoznać serie z jednego pomiaru */
function createRunPrefix(): string {
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  return `all-measurements-${timestamp}`;
}

/** uruchamia jedną serię dla wybranego datasetu, scenariusza i rodzaju wizyty */
function runMeasurementSeries(
  dataset: (typeof datasets)[number],
  flow: (typeof flows)[number],
  cacheMode: (typeof cacheModes)[number],
  repetitions: number,
  warmups: number,
  runPrefix: string,
): void {
  const runId = `${runPrefix}-${dataset}-${flow}-${cacheMode}`;

  runCommand(process.execPath, [
    tsxCli,
    "scripts/run-measurements.ts",
    `--flow=${flow}`,
    `--dataset=${dataset}`,
    `--cache=${cacheMode}`,
    `--repetitions=${repetitions}`,
    `--warmups=${warmups}`,
    `--run-id=${runId}`,
  ]);
}

/** wykonuje pełną macierz: 3 datasety, 2 scenariusze i 2 rodzaje wizyty. */
function main(): void {
  const repetitions = getIntegerArgument("repetitions", 30, 1);
  const warmups = getIntegerArgument("warmups", 3);
  const runPrefix = toSafePathPart(
    getArgument("run-prefix", createRunPrefix())!,
  );

  console.log("Pełna macierz pomiarowa");
  console.log(`prefiks serii: ${runPrefix}`);
  console.log(`powtórzenia: ${repetitions}`);
  console.log(`rozgrzewki: ${warmups}`);

  for (const dataset of datasets) {
    for (const flow of flows) {
      for (const cacheMode of cacheModes) {
        runMeasurementSeries(
          dataset,
          flow,
          cacheMode,
          repetitions,
          warmups,
          runPrefix,
        );
      }
    }
  }

  console.log(`\nZakończono wszystkie serie: ${runPrefix}`);
}

main();
