import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { request } from "@playwright/test";
import {
  authStateFile,
  cacheModes,
  datasets,
  flows,
  frameworks,
  measurementDatabaseUrl,
  measurementsDirectory,
  projectName,
  protocolVersion,
  repositoryDirectory,
  safeId,
  urls,
  type Framework,
} from "../measurement-config";
import { argument, choiceArgument, integerArgument, runCommand } from "./cli";

// Odczytuje parametry jednej serii pomiarowej, sprawdza ich poprawność i tworzy
// domyślny identyfikator, pod którym zostaną zapisane wyniki.
function readConfiguration() {
  const flow = choiceArgument("flow", "read", flows);
  const dataset = choiceArgument(
    "dataset",
    "small",
    datasets.map((item) => item.name),
  );
  const cacheMode = choiceArgument("cache", "fresh-context", cacheModes);
  const repetitions = integerArgument("repetitions", 30, 2);
  const warmups = integerArgument("warmups", 3, 1);
  const defaultRunId = `${flow}-${dataset}-${cacheMode}-${new Date()
    .toISOString()
    .replace(/[^a-z0-9]/gi, "-")}`;
  const runId = safeId(argument("run-id", defaultRunId)!);

  if (process.env.MEASUREMENT_DIAGNOSTIC === "true") {
    throw new Error("Tryb diagnostyczny nie może zapisywać wyników pomiarowych");
  }

  return { flow, dataset, cacheMode, repetitions, warmups, runId };
}

const configuration = readConfiguration();
const { flow, dataset, cacheMode, repetitions, warmups, runId } = configuration;
const backendDirectory = path.join(repositoryDirectory, "backend");
const outputDirectory = path.join(measurementsDirectory, "results", "raw", runId);
const playwrightCli = path.join(
  measurementsDirectory,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);
const tsxCli = path.join(measurementsDirectory, "node_modules", "tsx", "dist", "cli.mjs");

// Pobiera informacje kontrolne wystawione przez usługę. Limit czasu pozwala
// szybko zgłosić, że operator nie uruchomił wymaganej aplikacji
async function readServiceInfo(name: string, url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${name} nie odpowiada pod ${url}: ${message}`);
  }
}

// Sprawdza równolegle oba frontendy i API. Odpowiedzi potwierdzają, że pomiar
// dotyczy produkcyjnych aplikacji, właściwych rendererów i bazy measurements
async function checkServices() {
  const [next, blazor, api] = await Promise.all([
    readServiceInfo("Next.js", `${urls.next}/measurement-info`),
    readServiceInfo("Blazor", `${urls.blazor}/measurement-info`),
    readServiceInfo("Express API", `${new URL(urls.api).origin}/measurement-info`),
  ]);

  if (!next.production || next.api !== urls.api || next.renderer !== "react-client") {
    throw new Error("Next.js nie działa w wymaganym trybie pomiarowym.");
  }
  if (!blazor.production || blazor.renderer !== "webassembly") {
    throw new Error("Blazor nie działa jako produkcyjny WebAssembly");
  }
  if (!api.production || !api.isolated) {
    throw new Error("Express API nie korzysta z izolowanej bazy pomiarowej");
  }

  return { next, blazor, api };
}

// Zwraca ścieżkę zapisanej sesji użytkownika i przerywa pracę, jeśli plik nie
// został wcześniej utworzony podczas ręcznego logowania.
function authFilePath() {
  const storageState = path.join(measurementsDirectory, authStateFile);
  if (!fs.existsSync(storageState)) {
    throw new Error(`Brak sesji Playwright: ${authStateFile}`);
  }
  return storageState;
}

// Używa zapisanych cookies do sprawdzenia użytkownika pomiarowego. Jednocześnie
// wymaga odłączonego Google Calendar, aby zewnętrzna usługa nie zakłócała prób.
async function checkSession() {
  const client = await request.newContext({ storageState: authFilePath() });
  try {
    const [authResponse, calendarResponse] = await Promise.all([
      client.get(`${urls.api}/auth/me`),
      client.get(`${urls.api}/google-calendar/status`),
    ]);

    if (!authResponse.ok()) {
      throw new Error("Sesja użytkownika wygasła lub jest nieprawidłowa.");
    }
    if (!calendarResponse.ok()) {
      throw new Error("Nie udało się sprawdzić integracji Google Calendar.");
    }

    const user = (await authResponse.json()).data;
    const calendar = (await calendarResponse.json()).data;

    if (calendar.connected) {
      throw new Error("Konto pomiarowe musi mieć odłączony Google Calendar.");
    }

    return user.email as string;

  } finally {
    await client.dispose();
  }
}

// Porównuje aktualną liczbę sal i rezerwacji z wybranym wariantem datasetu.
// Zapobiega rozpoczęciu serii na przypadkowych albo niepełnych danych.
async function checkDataset() {
  const client = await request.newContext({ storageState: authFilePath() });
  try {
    const [roomsResponse, reservationsResponse] = await Promise.all([
      client.get(`${urls.api}/rooms`),
      client.get(`${urls.api}/reservations/my`),
    ]);

    if (!roomsResponse.ok() || !reservationsResponse.ok()) {
      throw new Error("Nie udało się sprawdzić datasetu pomiarowego.");
    }

    const rooms = (await roomsResponse.json()).data;
    const reservations = (await reservationsResponse.json()).data;
    const expected = datasets.find((item) => item.name === dataset)!;

    if (rooms.length !== expected.roomCount) {
      throw new Error(`Nieprawidłowa liczba sal: ${rooms.length}/${expected.roomCount}.`);
    }
    if (reservations.length !== expected.reservationCount) {
      throw new Error(
        `Nieprawidłowa liczba rezerwacji: ${reservations.length}/${expected.reservationCount}.`,
      );
    }
  } finally {
    await client.dispose();
  }
}

// Uruchamia krótkie polecenie systemowe i zwraca jego standardowe wyjście.
// Funkcja służy do zapisu wersji narzędzi i stanu repozytorium w manifeście.
function capture(command: string, argumentsList: string[]) {
  return execFileSync(command, argumentsList, {
    cwd: repositoryDirectory,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

// Buduje manifest opisujący konfigurację serii, wersje usług, konto pomiarowe
// oraz komputer. Dane pozwalają później odtworzyć warunki eksperymentu.
function createManifest(
  services: Awaited<ReturnType<typeof checkServices>>,
  email: string,
) {
  return {
    protocolVersion,
    configuration,
    services,
    measurementUser: email,
    startedAt: new Date().toISOString(),
    finishedAt: undefined as string | undefined,
    status: "running",
    node: process.version,
    dotnet: capture("dotnet", ["--version"]),
    commit: capture("git", ["rev-parse", "HEAD"]),
    dirtyFiles: capture("git", ["status", "--short"]),
    system: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      ramBytes: os.totalmem(),
    },
    network: "localhost-unthrottled",
    playwright: JSON.parse(
      fs.readFileSync(
        path.join(
          measurementsDirectory,
          "node_modules",
          "@playwright",
          "test",
          "package.json",
        ),
        "utf8",
      ),
    ).version,
  };
}

// Zapisuje bieżący stan manifestu. Ta sama funkcja utrwala rozpoczęcie serii,
// jej poprawne zakończenie albo informację o błędzie.
function saveManifest(manifest: ReturnType<typeof createManifest>) {
  fs.writeFileSync(
    path.join(outputDirectory, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
}

// Odtwarza dokładnie wybrany dataset dla konta pomiarowego. Reset jest poza
// mierzonym czasem i zapewnia taki sam stan początkowy każdej próby zapisu.
function resetDataset(email: string) {
  runCommand(process.execPath, [`prisma/seed.measurements.${dataset}.js`], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      DATABASE_URL: measurementDatabaseUrl,
      DIRECT_URL: measurementDatabaseUrl,
      MEASUREMENT_USER_EMAIL: email,
      MEASUREMENT_STRICT_DATASET: "true",
    },
  });
}

// Uruchamia właściwy plik testowy Playwright dla jednego frontendu. Zmienne
// środowiskowe przekazują testom numer próby i miejsce zapisu rezultatów.
function runBrowserTests(framework: Framework, sampleIndex: number, record: boolean) {
  const project = projectName(framework, dataset, cacheMode);
  runCommand(
    process.execPath,
    [playwrightCli, "test", `tests/${flow}-flow.spec.ts`, `--project=${project}`],
    {
      env: {
        ...process.env,
        MEASUREMENT_RUN_ID: runId,
        MEASUREMENT_SAMPLE_INDEX: String(sampleIndex),
        MEASUREMENT_RECORD_RESULTS: String(record),
        MEASUREMENT_REPORT_DIR: path.join(
          outputDirectory,
          "reports",
          `${framework}-${sampleIndex}`,
        ),
      },
    },
  );
}

// Wykonuje jedną próbę dla obu frameworków. Dla zapisów resetuje dane przed
// każdym frontendem, a w mierzonych próbach zmienia kolejność według AB/BA.
function runRound(email: string, sampleIndex: number, record: boolean) {
  const frameworkOrder = frameworks.map((framework) => framework.name);
  if (record && sampleIndex % 2 !== 0) {
    frameworkOrder.reverse();
  }

  for (const framework of frameworkOrder) {
    if (flow === "write") {
      resetDataset(email);
    }
    runBrowserTests(framework, sampleIndex, record);
  }
}

// Najpierw wykonuje preflight, potem rozgrzewki i właściwe próby. Na końcu
// tworzy raport, aktualizuje manifest i przy zapisie przywraca czysty dataset.
async function main() {
  if (fs.existsSync(outputDirectory)) {
    throw new Error(`Run ID ${runId} już istnieje.`);
  }

  const services = await checkServices();
  const email = await checkSession();
  if (flow === "write") {
    resetDataset(email);
  }
  await checkDataset();

  fs.mkdirSync(outputDirectory, { recursive: true });
  const manifest = createManifest(services, email);
  saveManifest(manifest);

  try {
    for (let index = 0; index < warmups; index++) {
      runRound(email, -index - 1, false);
    }
    for (let index = 0; index < repetitions; index++) {
      runRound(email, index, true);
    }

    runCommand(process.execPath, [
      tsxCli,
      "scripts/summarize-results.ts",
      `--run-id=${runId}`,
    ]);
    manifest.status = "complete";
  } catch (error) {
    manifest.status = "failed";
    throw error;
  } finally {
    if (flow === "write") {
      resetDataset(email);
    }
    manifest.finishedAt = new Date().toISOString();
    saveManifest(manifest);
  }
}

await main();
