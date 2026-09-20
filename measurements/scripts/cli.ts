import { spawnSync } from "node:child_process";
import { measurementsDirectory } from "../measurement-config";

type CommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

// Odczytuje parametr zapisany jako --nazwa=wartość. Gdy parametr nie został
// przekazany, zwraca podaną wartość domyślną.
export function argument(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find((item) => item.startsWith(prefix));

  return value ? value.slice(prefix.length) : fallback;
}

// Odczytuje parametr liczbowy i od razu pilnuje, aby był liczbą całkowitą
// nie mniejszą niż dozwolone minimum.
export function integerArgument(name: string, fallback: number, minimum = 0): number {
  const value = Number(argument(name, String(fallback)));

  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`Parametr --${name} musi być liczbą całkowitą >= ${minimum}.`);
  }

  return value;
}

// Odczytuje parametr tekstowy i sprawdza, czy należy do listy obsługiwanych
// wartości. Typ wyniku jest dzięki temu ograniczony do elementów tej listy.
export function choiceArgument<T extends string>(
  name: string,
  fallback: T,
  choices: readonly T[],
): T {
  const value = argument(name, fallback) as T;

  if (!choices.includes(value)) {
    throw new Error(`Parametr --${name} musi mieć wartość: ${choices.join(", ")}.`);
  }

  return value;
}

// Uruchamia polecenie synchronicznie, przekazując jego wyjście do bieżącego
// terminala. Błąd uruchomienia lub niezerowy kod kończy skrypt wyjątkiem.
export function runCommand(
  executable: string,
  argumentsList: string[],
  options: CommandOptions = {},
): void {
  const result = spawnSync(
    executable,
    argumentsList,
    {
      cwd: options.cwd ?? measurementsDirectory,
      env: options.env ?? process.env,
      stdio: "inherit",
      windowsHide: true,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Polecenie "${executable}" zakończyło się kodem ${result.status}.`);
  }
}
