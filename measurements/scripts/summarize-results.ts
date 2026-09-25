import fs from "node:fs";
import path from "node:path";
import { measurementsDirectory, protocolVersion, safeId, steps } from "../measurement-config";
import { argument, readJson, writeJson } from "./cli";
import {
  sprawdzProbyPomiarowe, obliczStatystyki, obliczMediane, obliczPrzedzialBootstrap,
  type ProbaPomiarowa, type KonfiguracjaPomiaru,
} from "./statistics";

function readTrials(directory: string): ProbaPomiarowa[] {
  const trials: ProbaPomiarowa[] = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^(next|blazor)-/.test(entry.name)) continue;

    const projectDirectory = path.join(directory, entry.name);

    for (const filename of fs.readdirSync(projectDirectory)) {
      if (filename.endsWith(".json")) trials.push(readJson(path.join(projectDirectory, filename)));
    }
  }

  return trials;
}

function createSummary(trials: ProbaPomiarowa[], config: KonfiguracjaPomiaru) {
  sprawdzProbyPomiarowe(trials, config);

  const orderedTrials = [...trials].sort((a, b) => a.sampleIndex - b.sampleIndex);
  const groups = [];
  const comparisons = [];

  for (const step of steps[config.flow]) {
    const durations = (framework: string) => orderedTrials
      .filter((trial) => trial.framework === framework)
      .flatMap((trial) => trial.steps.filter((item) => item.step === step).map((item) => item.durationMs));

    const next = durations("next");
    const blazor = durations("blazor");

    groups.push(
      { framework: "next", step, ...obliczStatystyki(next) },
      { framework: "blazor", step, ...obliczStatystyki(blazor) },
    );

    const differences = next.map((duration, index) => duration - blazor[index]);

    comparisons.push({
      step,
      interpretation: "next minus blazor; negative favors Next",
      pairedMedianDifferenceMs: obliczMediane(differences),
      bootstrap95: obliczPrzedzialBootstrap(differences),
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
  const maximum = Math.max(...groups.map((group) => group.medianMs));

  const bars = groups.map((group, index) => {
    const top = index * 35 + 10;
    const width = maximum === 0 ? 0 : group.medianMs / maximum * 450;
    const color = group.framework === "next" ? "#2563eb" : "#9333ea";

    return `<text x="10" y="${top + 15}" font-size="12">${group.framework} ${group.step}</text>
      <rect x="310" y="${top}" width="${width}" height="20" fill="${color}" />
      <text x="${320 + width}" y="${top + 15}" font-size="12">${group.medianMs.toFixed(1)} ms</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${groups.length * 35 + 20}">
    <rect width="100%" height="100%" fill="white" />${bars.join("\n")}
  </svg>`;
}

function saveReports(directory: string, report: Summary) {
  writeJson(path.join(directory, "summary.json"), report);

  const columns = Object.keys(report.groups[0]) as (keyof Summary["groups"][number])[];
  const rows = report.groups.map((group) => columns.map((column) => group[column]).join(","));

  fs.writeFileSync(path.join(directory, "summary.csv"), [columns.join(","), ...rows].join("\n"));
  fs.writeFileSync(path.join(directory, "medians.svg"), createMedianChart(report.groups));
}

const runId = safeId(argument("run-id") ?? "");
const directory = path.join(measurementsDirectory, "results/raw", runId);
const manifest = readJson(path.join(directory, "manifest.json"));
const report = createSummary(readTrials(directory), manifest.configuration);

saveReports(directory, report);

console.table(report.groups);
console.table(report.comparisons);
