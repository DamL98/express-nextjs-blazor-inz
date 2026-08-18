import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
export const measurementsDirectory = path.resolve(scriptsDirectory, "..");
export const repositoryDirectory = path.resolve(measurementsDirectory, "..");

type CommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

/** odczytuje argument CLI w formacie --nazwa=wartosc, używane przez skrypty pomiarowe */
export function getArgument(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));

  return argument ? argument.slice(prefix.length) : fallback;
}

/** zamienia argument CLI na liczbę całkowitą i sprawdza jego min value */
export function getIntegerArgument(
  name: string,
  fallback: number,
  minimum = 0,
): number {
  const value = Number(getArgument(name, String(fallback)));

  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(
      `Parametr --${name} musi być liczbą całkowitą >= ${minimum}.`,
    );
  }

  return value;
}

/** uruchamia polecenie z widocznym wynikiem / przerywa skrypt gdy wykryje error */
export function runCommand(
  executable: string,
  argumentsList: string[],
  options: CommandOptions = {},
): void {
  const result = spawnSync(executable, argumentsList, {
    cwd: options.cwd ?? measurementsDirectory,
    env: options.env ?? process.env,
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Polecenie "${executable}" zakończyło się kodem ${result.status}.`,
    );
  }
}

/** nazwy sciezki pliku */
export function toSafePathPart(value: string): string {
  return value.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
}
