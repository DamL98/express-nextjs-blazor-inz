import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { measurementsDirectory } from "../measurement-config";

type CommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv
};

export function argument(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;

  return process.argv
    .slice(2)
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length)
    ?? fallback;
}

export function integerArgument(name: string, fallback: number, minimum = 0) {
  const number = Number(argument(name, String(fallback)));

  if (!Number.isInteger(number) || number < minimum) {
    throw new Error(`Parametr --${name} musi być liczbą całkowitą >= ${minimum}.`);
  }

  return number;
}

export function choiceArgument<T extends string>(name: string, fallback: T, choices: readonly T[]): T {
  const selected = argument(name, fallback) as T;

  if (!choices.includes(selected)) {
    throw new Error(`Parametr --${name} musi mieć wartość: ${choices.join(", ")}.`);
  }

  return selected;
}

// bez shella, argumenty trafiają bezpośrednio do uruchamianego programu
export function runCommand(executable: string, argumentsList: string[], options: CommandOptions = {}) {
  const result = spawnSync(executable, argumentsList, {
    cwd: measurementsDirectory,
    env: process.env,
    ...options,
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Polecenie "${executable}" zakończyło się kodem ${result.status}.`);
  }
}

export function runTypeScript(script: string, args: string[]) {
  const tsx = path.join(measurementsDirectory, "node_modules/tsx/dist/cli.mjs");
  runCommand(process.execPath, [tsx, script, ...args]);
}

export function readJson(filename: string) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

export function writeJson(filename: string, data: unknown) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}
