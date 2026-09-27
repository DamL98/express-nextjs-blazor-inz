import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";

const command = process.argv[2];
if (!["build", "start"].includes(command)) {
  throw new Error("Expected build or start");
}

const settings = parseEnv(readFileSync(new URL("../.env.measurements", import.meta.url), "utf8"));
const result = spawnSync(process.execPath, [
  "node_modules/next/dist/bin/next", command,
  ...(command === "start" ? ["--port", "3100"] : []),
  ...process.argv.slice(3),
], {
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    ...settings,
    NODE_ENV: "production",
    MEASUREMENT_DATABASE_ONLY: "true",
  },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
