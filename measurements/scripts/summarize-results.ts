import fs from "node:fs";
import path from "node:path";

type Measurement = {
  runId: string;
  project: string;
  framework: string;
  dataset: string;
  cacheMode: string;
  runtime: string;
  sampleIndex: number;
  test: string;
  step: string;
  durationMs: number;
};

type Summary = {
  runId: string;
  framework: string;
  dataset: string;
  cacheMode: string;
  runtime: string;
  test: string;
  step: string;
  count: number;
  medianMs: number;
  meanMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  standardDeviationMs: number;
};

function argument(name: string) {
  const prefix = `--${name}=`;
  const item = process.argv.slice(2).find((value) => value.startsWith(prefix));

  return item?.slice(prefix.length);
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function median(sortedValues: number[]): number {
  const middle = Math.floor(sortedValues.length / 2);

  return sortedValues.length % 2 === 0
    ? (sortedValues[middle - 1] + sortedValues[middle]) / 2
    : sortedValues[middle];
}

function percentile(sortedValues: number[], percentileValue: number) {
  const index = Math.max(
    0,
    Math.ceil((percentileValue / 100) * sortedValues.length) - 1,
  );

  return sortedValues[index];
}

function sampleStandardDeviation(values: number[], mean: number) {
  if (values.length < 2) {
    return 0;
  }

  const squaredDifferences = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0,
  );

  return Math.sqrt(squaredDifferences / (values.length - 1));
}

function csvValue(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: Summary[]) {
  const columns: (keyof Summary)[] = [
    "runId",
    "framework",
    "dataset",
    "cacheMode",
    "runtime",
    "test",
    "step",
    "count",
    "medianMs",
    "meanMs",
    "minMs",
    "maxMs",
    "p95Ms",
    "standardDeviationMs",
  ];

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(",")),
  ].join("\n");
}

const runId = argument("run-id");
const expectedSamplesValue = Number(argument("expected-samples"));
const expectedSamples = Number.isInteger(expectedSamplesValue)
  ? expectedSamplesValue
  : null;
const rawDirectory = path.resolve("results/raw");

if (!fs.existsSync(rawDirectory)) {
  throw new Error(`Brak katalogu wynikow: ${rawDirectory}`);
}

const measurements = walk(rawDirectory)
  .filter((file) => file.endsWith(".jsonl"))
  .flatMap((file) =>
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Measurement),
  )
  .filter((measurement) => !runId || measurement.runId === runId);

if (measurements.length === 0) {
  throw new Error(`Brak pomiarow dla runId: ${runId ?? "wszystkie"}`);
}

const uniqueSamples = new Set<string>();

for (const measurement of measurements) {
  const sampleKey = [
    measurement.runId,
    measurement.project,
    measurement.test,
    measurement.step,
    measurement.sampleIndex,
  ].join("|");

  if (uniqueSamples.has(sampleKey)) {
    throw new Error(`Powtorzona probka w wynikach: ${sampleKey}`);
  }

  uniqueSamples.add(sampleKey);
}

const groups = new Map<string, Measurement[]>();

for (const measurement of measurements) {
  const key = JSON.stringify([
    measurement.runId,
    measurement.framework,
    measurement.dataset,
    measurement.cacheMode,
    measurement.runtime,
    measurement.test,
    measurement.step,
  ]);
  const group = groups.get(key) ?? [];
  group.push(measurement);
  groups.set(key, group);
}

const summary: Summary[] = Array.from(groups.values()).map((entries) => {
  const values = entries
    .map((entry) => entry.durationMs)
    .sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const first = entries[0];

  return {
    runId: first.runId,
    framework: first.framework,
    dataset: first.dataset,
    cacheMode: first.cacheMode,
    runtime: first.runtime,
    test: first.test,
    step: first.step,
    count: values.length,
    medianMs: Number(median(values).toFixed(2)),
    meanMs: Number(mean.toFixed(2)),
    minMs: Number(values[0].toFixed(2)),
    maxMs: Number(values.at(-1)!.toFixed(2)),
    p95Ms: Number(percentile(values, 95).toFixed(2)),
    standardDeviationMs: Number(
      sampleStandardDeviation(values, mean).toFixed(2),
    ),
  };
});

if (expectedSamples !== null) {
  const invalidGroup = summary.find((group) => group.count !== expectedSamples);

  if (invalidGroup) {
    throw new Error(
      `Nieprawidlowa liczba probek dla ${invalidGroup.framework}/${invalidGroup.step}: ` +
        `${invalidGroup.count}, oczekiwano ${expectedSamples}.`,
    );
  }
}

summary.sort((left, right) =>
  [left.dataset, left.cacheMode, left.framework, left.step]
    .join("|")
    .localeCompare(
      [right.dataset, right.cacheMode, right.framework, right.step].join("|"),
    ),
);

console.table(summary);

const outputDirectory = path.resolve("results/playwright");
const safeRunId = (runId ?? "all-runs").replace(/[^a-z0-9-_]+/gi, "-");
const report = {
  generatedAt: new Date().toISOString(),
  runId: runId ?? null,
  measurementCount: measurements.length,
  groups: summary,
};

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(
  path.join(outputDirectory, `summary-${safeRunId}.json`),
  JSON.stringify(report, null, 2),
  "utf8",
);
fs.writeFileSync(
  path.join(outputDirectory, `summary-${safeRunId}.csv`),
  `${toCsv(summary)}\n`,
  "utf8",
);
fs.writeFileSync(
  path.join(outputDirectory, "summary.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);
