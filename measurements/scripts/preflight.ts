import fs from "node:fs";
import path from "node:path";
import { request, type APIRequestContext } from "@playwright/test";
import { authStateFile, datasets, measurementsDirectory, urls, type Dataset } from "../measurement-config";

async function serviceInfo(name: string, url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return await response.json();
  } catch (error) {
    throw new Error(`${name} nie odpowiada pod ${url}: ${error instanceof Error ? error.message : error}`);
  }
}

// każde sprawdzenie kończy się przed uruchomieniem seeda lub pomiaru
export async function checkServices() {
  const [next, blazor, api] = await Promise.all([
    serviceInfo("Next.js", `${urls.next}/measurement-info`),
    serviceInfo("Blazor", `${urls.blazor}/measurement-info`),
    serviceInfo("Express API", `${new URL(urls.api).origin}/measurement-info`),
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

  if (api.rateLimitEnabled !== false) {
    throw new Error("Pomiary wydajności wymagają RATE_LIMIT_ENABLED=false w izolowanym API");
  }

  return { next, blazor, api };
}

async function withSession<T>(action: (client: APIRequestContext) => Promise<T>) {
  const storageState = path.join(measurementsDirectory, authStateFile);
  if (!fs.existsSync(storageState)) throw new Error(`Brak sesji Playwright: ${authStateFile}`);

  const client = await request.newContext({ storageState });
  try {
    return await action(client);
  } finally {
    await client.dispose();
  }
}

async function apiData(client: APIRequestContext, endpoint: string, errorMessage: string) {
  const response = await client.get(`${urls.api}${endpoint}`);
  if (!response.ok()) throw new Error(errorMessage);

  return (await response.json()).data;
}

export function checkSession(): Promise<string> {
  return withSession(async (client) => {
    const [user, calendar] = await Promise.all([
      apiData(client, "/auth/me", "Sesja użytkownika wygasła lub jest nieprawidłowa"),
      apiData(client, "/google-calendar/status", "Nie udało się sprawdzić integracji Google Calendar"),
    ]);

    if (calendar.connected) throw new Error("Konto pomiarowe musi mieć odłączony Google Calendar");
    return user.email;
  });
}

export function checkDataset(dataset: Dataset) {
  return withSession(async (client) => {
    const errorMessage = "Nie udało się sprawdzić datasetu pomiarowego.";

    const [rooms, reservations] = await Promise.all([
      apiData(client, "/rooms", errorMessage),
      apiData(client, "/reservations/my", errorMessage),
    ]);

    const expected = datasets.find((item) => item.name === dataset)!;

    if (rooms.length !== expected.roomCount) {
      throw new Error(`Nieprawidłowa liczba sal: ${rooms.length}/${expected.roomCount}.`);
    }

    if (reservations.length !== expected.reservationCount) {
      throw new Error(`Nieprawidłowa liczba rezerwacji: ${reservations.length}/${expected.reservationCount}.`);
    }
  });
}
