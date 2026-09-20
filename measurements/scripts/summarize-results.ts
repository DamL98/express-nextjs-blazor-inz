import fs from "node:fs";
import path from "node:path";
import {
  measurementsDirectory,
  protocolVersion,
  safeId,
  steps,
} from "../measurement-config";
import { argument } from "./cli";
import {
  sprawdzProbyPomiarowe,
  obliczStatystyki,
  obliczMediane,
  obliczPrzedzialBootstrap,
  type ProbaPomiarowa,
  type KonfiguracjaPomiaru,
} from "./statistics";

function readTrials(directory: string): ProbaPomiarowa[] {
  const proby: ProbaPomiarowa[] = [];
  for (const entry of fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (directoryEntry) =>
        directoryEntry.isDirectory() && /^(next|blazor)-/.test(directoryEntry.name),
    )) {
    for (const filename of fs
      .readdirSync(path.join(directory, entry.name))
      .filter((f) => f.endsWith(".json"))) {
      proby.push(
        JSON.parse(fs.readFileSync(path.join(directory, entry.name, filename), "utf8")),
      );
    }
  }

  return proby;
}

function createSummary(proby: ProbaPomiarowa[], config: KonfiguracjaPomiaru) {
  sprawdzProbyPomiarowe(proby, config);
  const groups = [];
  const comparisons = [];

  for (const step of steps[config.flow]) {
    const durationsFor = (framework: string) =>
      proby
        .filter((proba) => proba.framework === framework)
        .sort((left, right) => left.sampleIndex - right.sampleIndex)
        .flatMap((proba) =>
          proba.steps
            .filter((pomiarKroku) => pomiarKroku.step === step)
            .map((pomiarKroku) => pomiarKroku.durationMs),
        );
    const nextDurations = durationsFor("next");
    const blazorDurations = durationsFor("blazor");

    for (const [framework, times] of [
      ["next", nextDurations],
      ["blazor", blazorDurations],
    ] as const) {
      groups.push({ framework, step, ...obliczStatystyki(times) });
    }
    const roznice = nextDurations.map(
      (duration, index) => duration - blazorDurations[index],
    );
    comparisons.push({
      step,
      interpretation: "next minus blazor; negative favors Next",
      pairedMedianDifferenceMs: obliczMediane(roznice),
      bootstrap95: obliczPrzedzialBootstrap(roznice),
    });
  }

  return {
    protocolVersion,
    runId: config.runId,
    configuration: config,
    generatedAt: new Date().toISOString(),
    groups,
    comparisons,
  };
}

type Summary = ReturnType<typeof createSummary>;

function createMedianChart(groups: Summary["groups"]) {
  const maximumMedian = Math.max(...groups.map((group) => group.medianMs));
  const bars = groups.map((group, index) => {
    const top = index * 35 + 10;
    const labelY = top + 15;
    const width = maximumMedian === 0 ? 0 : (group.medianMs / maximumMedian) * 450;
    const color = group.framework === "next" ? "#2563eb" : "#9333ea";

    return `
      <text x="10" y="${labelY}" font-size="12">${group.framework} ${group.step}</text>
      <rect x="310" y="${top}" width="${width}" height="20" fill="${color}" />
      <text x="${320 + width}" y="${labelY}" font-size="12">${group.medianMs.toFixed(1)} ms</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${groups.length * 35 + 20}">
    <rect width="100%" height="100%" fill="white" />
    ${bars.join("\n")}
  </svg>`;
}

function saveReports(directory: string, report: Summary) {
  const { groups } = report;
  fs.writeFileSync(path.join(directory, "summary.json"), JSON.stringify(report, null, 2));
  const columns = Object.keys(groups[0]) as (keyof (typeof groups)[number])[];
  fs.writeFileSync(
    path.join(directory, "summary.csv"),
    [
      columns.join(","),
      ...groups.map((group) => columns.map((column) => group[column]).join(",")),
    ].join("\n"),
  );

  fs.writeFileSync(path.join(directory, "medians.svg"), createMedianChart(groups));
}

function main() {
  const runId = safeId(argument("run-id") ?? "");
  const directory = path.join(measurementsDirectory, "results/raw", runId);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, "manifest.json"), "utf8"),
  );
  const report = createSummary(readTrials(directory), manifest.configuration);
  saveReports(directory, report);
  console.table(report.groups);
  console.table(report.comparisons);
}

main();
