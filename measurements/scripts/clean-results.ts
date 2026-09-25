import fs from "node:fs";
import path from "node:path";
import { measurementsDirectory } from "../measurement-config";

// usuwa tylko foldery wyników
for (const name of ["results/raw", "results/playwright", "test-results"]) {
  const directory = path.resolve(measurementsDirectory, name);
  const relative = path.relative(measurementsDirectory, directory);

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Odmowa usunięcia ścieżki spoza katalogów wyników: ${directory}`);
  }

  fs.rmSync(directory, { recursive: true, force: true });

  console.log(`Usunięto: ${relative}`);
}
