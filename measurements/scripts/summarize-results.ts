import fs from "node:fs";
import path from "node:path";

type Measurement = {
  framework: string;
  cacheMode: string;
  test: string;
  step: string;
  durationMs: number;
};

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function standardDeviation(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    values.length;

  return Math.sqrt(variance);
}

const rawDirectory = path.resolve("results/raw");

const measurements = walk(rawDirectory)
  .filter((file) => file.endsWith(".jsonl"))
  .flatMap((file) =>
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Measurement),
  );

const groups = Map.groupBy(
  measurements,
  (item) => `${item.framework}|${item.cacheMode}|${item.step}`,
);

const summary = Array.from(groups.entries()).map(([key, entries]) => {
  const [framework, cacheMode, step] = key.split("|");
  const values = entries.map((entry) => entry.durationMs);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    framework,
    cacheMode,
    step,
    count: values.length,
    medianMs: Number(median(values).toFixed(2)),
    meanMs: Number(mean.toFixed(2)),
    minMs: Number(Math.min(...values).toFixed(2)),
    maxMs: Number(Math.max(...values).toFixed(2)),
    standardDeviationMs: Number(standardDeviation(values).toFixed(2)),
  };
});

console.table(summary);

fs.mkdirSync("results/playwright", { recursive: true });

fs.writeFileSync(
  "results/playwright/summary.json",
  JSON.stringify(summary, null, 2),
  "utf8",
);