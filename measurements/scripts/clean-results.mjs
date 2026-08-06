import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const measurementsDirectory = path.resolve(scriptDirectory, "..");
const targets = [
  path.join(measurementsDirectory, "results", "raw"),
  path.join(measurementsDirectory, "results", "playwright"),
  path.join(measurementsDirectory, "test-results"),
];

for (const target of targets) {
  const relativePath = path.relative(measurementsDirectory, target);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Odmowa usuniecia sciezki spoza measurements: ${target}`);
  }

  fs.rmSync(target, { recursive: true, force: true });
  console.log(`Usunieto: ${relativePath}`);
}
