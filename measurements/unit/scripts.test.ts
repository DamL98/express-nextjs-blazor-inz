import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { measurementsDirectory, protocolVersion, steps } from "../measurement-config";
import { obliczStatystyki, obliczPrzedzialBootstrap } from "../scripts/statistics";

function runScript(script: string, args: string[]) {
  return spawnSync(process.execPath, [
    path.join(measurementsDirectory, "node_modules/tsx/dist/cli.mjs"), script, ...args,
  ], { cwd: measurementsDirectory, encoding: "utf8", windowsHide: true });
}

test("gotowce zachowują liczbę serii i pozwalają nadpisać parametry", () => {
  for (const [preset, count] of [["single", 1], ["pilot", 6], ["all", 18]] as const) {
    const result = runScript("scripts/run-preset.ts", [
      `--preset=${preset}`, "--dry-run", "--repetitions=8", "--warmups=2",
    ]);
    assert.equal(result.status, 0, result.stderr);

    const series = result.stdout.trim().split("\n");
    assert.equal(series.length, count);
    assert.equal(new Set(series).size, count);
    assert.ok(series.every((line) => line.includes("--repetitions=8 --warmups=2 --prepare-dataset=true")));
  }

  const invalid = runScript("scripts/run-preset.ts", ["--preset=all", "--repetitions=1", "--dry-run"]);
  assert.notEqual(invalid.status, 0);
});

test("statystyki zachowują wynik sprzed refaktoryzacji", () => {
  assert.deepEqual(obliczStatystyki([1, 2, 5, 9, 12, 20]), {
    count: 6, medianMs: 7, meanMs: 8.166666666666666,
    minMs: 1, maxMs: 20,
    p95Ms: 20,
    standardDeviationMs: 7.139094246938239,
  });

  assert.deepEqual(obliczPrzedzialBootstrap([-3, 1, 5, -2, 10]), { low: -3, high: 10 });
});

test("raport zapisuje JSON, CSV i SVG oraz odrzuca nieudaną próbę", () => {
  const runId = `unit-report-${randomUUID()}`;
  const resultsRoot = path.resolve(measurementsDirectory, "results/raw");
  const directory = path.join(resultsRoot, runId);
  const configuration = { runId, flow: "read", dataset: "small", cacheMode: "fresh-context", repetitions: 2 };

  let sampleFile = "";

  try {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "manifest.json"), JSON.stringify({ configuration }));

    for (const framework of ["next", "blazor"] as const) {
      const project = path.join(directory, `${framework}-small`);
      fs.mkdirSync(project);

      for (let sampleIndex = 0; sampleIndex < 2; sampleIndex++) {
        for (const step of steps.read) {
          const trial = {
            ...configuration, protocolVersion, framework, sampleIndex,
            test: step, status: "passed", retry: 0,
            steps: [{ step, runtime: framework === "next" ? "react-client" : "webassembly", durationMs: framework === "next" ? 10 : 20 }],
          };

          sampleFile = path.join(project, `${step}-${sampleIndex}.json`);
          fs.writeFileSync(sampleFile, JSON.stringify(trial));
        }
      }
    }
    const result = runScript("scripts/summarize-results.ts", [`--run-id=${runId}`]);
    assert.equal(result.status, 0, result.stderr);

    const report = JSON.parse(fs.readFileSync(path.join(directory, "summary.json"), "utf8"));
    assert.equal(report.groups.length, steps.read.length * 2);
    assert.ok(report.groups.every((group: { count: number }) => group.count === 2));
    assert.ok(report.comparisons.every((comparison: { pairedMedianDifferenceMs: number }) => comparison.pairedMedianDifferenceMs === -10));

    assert.equal(fs.readFileSync(path.join(directory, "summary.csv"), "utf8").split("\n").length, 9);
    assert.match(fs.readFileSync(path.join(directory, "medians.svg"), "utf8"), /<svg/);

    const failedTrial = JSON.parse(fs.readFileSync(sampleFile, "utf8"));
    fs.writeFileSync(sampleFile, JSON.stringify({ ...failedTrial, status: "failed" }));

    assert.notEqual(runScript("scripts/summarize-results.ts", [`--run-id=${runId}`]).status, 0);
  } finally {
    // usuwamy wyłącznie katalog utworzony przez ten test
    assert.equal(path.dirname(directory), resultsRoot);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
