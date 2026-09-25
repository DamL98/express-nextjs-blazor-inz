import { cacheModes, datasets, flows } from "../measurement-config";
import { choiceArgument, integerArgument, runTypeScript } from "./cli";

const preset = choiceArgument("preset", "single", ["single", "pilot", "all"]);
const repetitions = integerArgument("repetitions", preset === "pilot" ? 5 : 30, 2);
const warmups = integerArgument("warmups", preset === "pilot" ? 2 : 3, 1);
const dryRun = process.argv.includes("--dry-run");
const datasetNames = datasets.map((dataset) => dataset.name);

let selectedFlows = [...flows];
let selectedDatasets = [...datasetNames];
let selectedCacheModes = [...cacheModes];

if (preset === "single") {
  selectedFlows = [choiceArgument("flow", "read", flows)];
  selectedDatasets = [choiceArgument("dataset", "small", datasetNames)];
  selectedCacheModes = [choiceArgument("cache", "fresh-context", cacheModes)];
} else if (preset === "pilot") {
  selectedDatasets = ["small"];
}

// kolejne serie kończą się przed rozpoczęciem następnej
// dry-run tylko wyświetla plan
for (const dataset of selectedDatasets) {
  for (const flow of selectedFlows) {
    for (const cache of selectedCacheModes) {
      const args = [
        `--flow=${flow}`,
        `--dataset=${dataset}`,
        `--cache=${cache}`,
        `--repetitions=${repetitions}`,
        `--warmups=${warmups}`,
        "--prepare-dataset=true",
      ];
      console.log(`Seria: ${args.join(" ")}`);

      if (!dryRun) runTypeScript("scripts/run-measurements.ts", args);
    }
  }
}
