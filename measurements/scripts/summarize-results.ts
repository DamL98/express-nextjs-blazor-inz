import fs from "node:fs";
import path from "node:path";
import {
  getArgument,
  measurementsDirectory,
  toSafePathPart,
} from "./script-utils";

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

type SummaryOptions = {
  runId?: string;
  expectedSamples?: number;
};

const summaryColumns: (keyof Summary)[] = [
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

/** odczytuje opcjonalny runId i liczbę próbek dla pomiaru */
function readSummaryOptions(): SummaryOptions {
  const runId = getArgument("run-id");
  const expectedSamplesArgument = getArgument("expected-samples");

  if (!expectedSamplesArgument) {
    return { runId };
  }

  const expectedSamples = Number(expectedSamplesArgument);

  if (!Number.isInteger(expectedSamples) || expectedSamples < 1) {
    throw new Error("Parametr --expected-samples musi być liczbą całkowitą");
  }

  return { runId, expectedSamples };
}

/** wyszukuje pliki .jsonl zapisane przez testy Playwright */
function findMeasurementFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findMeasurementFiles(fullPath);
    }

    return fullPath.endsWith(".jsonl") ? [fullPath] : [];
  });
}

/** wczytuje plik JSONL do tablicy próbek pomiarowych */
function readMeasurementFile(file: string): Measurement[] {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Measurement);
}

/** wczytuje wszystkie próbki i opcjonalnie ogranicza je do jednego uruchomienia */
function loadMeasurements(rawDirectory: string, runId?: string): Measurement[] {
  const measurements = findMeasurementFiles(rawDirectory)
    .flatMap(readMeasurementFile)
    .filter((measurement) => !runId || measurement.runId === runId);

  if (measurements.length === 0) {
    throw new Error(`Brak pomiarów dla runId: ${runId ?? "wszystkie"}`);
  }

  return measurements;
}

/** Sprawdza, czy ten sam krok i indeks próbki nie zostały zapisane więcej niż raz */
function validateUniqueSamples(measurements: Measurement[]): void {
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
      throw new Error(`Powtórzona próbka w wynikach: ${sampleKey}`);
    }

    uniqueSamples.add(sampleKey);
  }
}

/** grupuje próbki opisujące ten sam framework, dataset, test i krok */
function groupMeasurements(
  measurements: Measurement[],
): Map<string, Measurement[]> {
  const groups = new Map<string, Measurement[]>();

  for (const measurement of measurements) {
    const groupKey = JSON.stringify([
      measurement.runId,
      measurement.framework,
      measurement.dataset,
      measurement.cacheMode,
      measurement.runtime,
      measurement.test,
      measurement.step,
    ]);
    const group = groups.get(groupKey) ?? [];

    group.push(measurement);
    groups.set(groupKey, group);
  }

  return groups;
}

/** obl medianę dla posortowanej listy czasów wykonania */
function calculateMedian(sortedValues: number[]): number {
  const middle = Math.floor(sortedValues.length / 2);

  return sortedValues.length % 2 === 0
    ? (sortedValues[middle - 1] + sortedValues[middle]) / 2
    : sortedValues[middle];
}

/** obl wskazany percentyl - raport używa tej funkcji do wartości p95 */
function calculatePercentile(
  sortedValues: number[],
  percentile: number,
): number {
  const index = Math.max(
    0,
    Math.ceil((percentile / 100) * sortedValues.length) - 1,
  );

  return sortedValues[index];
}

/** obl odchylenie standardowe próby - używane w tabeli wynikowej */
function calculateSampleStandardDeviation(
  values: number[],
  mean: number,
): number {
  if (values.length < 2) {
    return 0;
  }

  const squaredDifferences = values.reduce(
    (sum, value) => sum + (value - mean) ** 2,
    0,
  );

  return Math.sqrt(squaredDifferences / (values.length - 1));
}

/** zaokrągla wynik czasowy do dwóch 2msc. p.p. -  czytelny raport */
function roundMilliseconds(value: number): number {
  return Number(value.toFixed(2));
}

/** zamienia jedną grupę próbek na zestaw statystyk prezentowany w raporcie */
function summarizeGroup(entries: Measurement[]): Summary {
  const durations = entries
    .map((entry) => entry.durationMs)
    .sort((left, right) => left - right);
  const mean = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const first = entries[0];

  return {
    runId: first.runId,
    framework: first.framework,
    dataset: first.dataset,
    cacheMode: first.cacheMode,
    runtime: first.runtime,
    test: first.test,
    step: first.step,
    count: durations.length,
    medianMs: roundMilliseconds(calculateMedian(durations)),
    meanMs: roundMilliseconds(mean),
    minMs: roundMilliseconds(durations[0]),
    maxMs: roundMilliseconds(durations.at(-1)!),
    p95Ms: roundMilliseconds(calculatePercentile(durations, 95)),
    standardDeviationMs: roundMilliseconds(
      calculateSampleStandardDeviation(durations, mean),
    ),
  };
}

/** Tworzy posortowaną listę podsumowań ze wszystkich grup pomiarowych */
function createSummary(measurements: Measurement[]): Summary[] {
  const groups = groupMeasurements(measurements);
  const summary = Array.from(groups.values(), summarizeGroup);

  return summary.sort((left, right) =>
    [left.dataset, left.cacheMode, left.framework, left.step]
      .join("|")
      .localeCompare(
        [right.dataset, right.cacheMode, right.framework, right.step].join("|"),
      ),
  );
}

/** Sprawdza kompletność danych, gdy podano oczekiwaną liczbę próbek */
function validateSampleCounts(
  summary: Summary[],
  expectedSamples?: number,
): void {
  if (expectedSamples === undefined) {
    return;
  }

  const invalidGroup = summary.find((group) => group.count !== expectedSamples);

  if (invalidGroup) {
    throw new Error(
      `Nieprawidłowa liczba próbek dla ${invalidGroup.framework}/${invalidGroup.step}: ` +
        `${invalidGroup.count}, oczekiwano ${expectedSamples}.`,
    );
  }
}

/** Zabezpiecza tekst CSV przed przecinkami, cudzysłowami i znakami nowej linii */
function escapeCsvValue(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Zamienia tabelę statystyk na treść pliku CSV używanego w dalszej analizie */
function convertSummaryToCsv(rows: Summary[]): string {
  return [
    summaryColumns.join(","),
    ...rows.map((row) =>
      summaryColumns.map((column) => escapeCsvValue(row[column])).join(","),
    ),
  ].join("\n");
}

/** Zapisuje wersję JSON i CSV raportu w katalogu results/playwright */
function saveSummaryReports(
  summary: Summary[],
  measurementCount: number,
  runId?: string,
): void {
  const outputDirectory = path.join(
    measurementsDirectory,
    "results",
    "playwright",
  );
  const safeRunId = toSafePathPart(runId ?? "all-runs");
  const report = {
    generatedAt: new Date().toISOString(),
    runId: runId ?? null,
    measurementCount,
    groups: summary,
  };
  const jsonReport = JSON.stringify(report, null, 2);

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(outputDirectory, `summary-${safeRunId}.json`),
    jsonReport,
    "utf8",
  );
  fs.writeFileSync(
    path.join(outputDirectory, `summary-${safeRunId}.csv`),
    `${convertSummaryToCsv(summary)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(outputDirectory, "summary.json"),
    jsonReport,
    "utf8",
  );
}

/** Wczytuje próbki, waliduje je, oblicza statystyki i zapisuje raport końcowy */
function main(): void {
  const options = readSummaryOptions();
  const rawDirectory = path.join(measurementsDirectory, "results", "raw");

  if (!fs.existsSync(rawDirectory)) {
    throw new Error(`Brak katalogu wyników: ${rawDirectory}`);
  }

  const measurements = loadMeasurements(rawDirectory, options.runId);
  validateUniqueSamples(measurements);

  const summary = createSummary(measurements);
  validateSampleCounts(summary, options.expectedSamples);
  console.table(summary);
  saveSummaryReports(summary, measurements.length, options.runId);
}

main();
