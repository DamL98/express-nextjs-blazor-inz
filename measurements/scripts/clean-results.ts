import fs from "node:fs";
import path from "node:path";
import { measurementsDirectory } from "./script-utils";

const resultDirectories = [
  path.join(measurementsDirectory, "results", "raw"),
  path.join(measurementsDirectory, "results", "playwright"),
  path.join(measurementsDirectory, "test-results"),
];

/** sprawdza czy usuwany katalog należy do measurements */
function validateResultDirectory(directory: string): void {
  const relativePath = path.relative(measurementsDirectory, directory);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Odmowa usunięcia ścieżki spoza measurements: ${directory}`);
  }
}

/** usuwa jeden wygenerowany katalog wyników - jest wywoływana dla każdej pozycji z listy */
function removeResultDirectory(directory: string): void {
  validateResultDirectory(directory);
  fs.rmSync(directory, { recursive: true, force: true });
  console.log(`Usunięto: ${path.relative(measurementsDirectory, directory)}`);
}

/** czyści wyniki Playwright i surowe próbki przed rozpoczęciem nowych pomiarów */
function main(): void {
  resultDirectories.forEach(removeResultDirectory);
}

main();
