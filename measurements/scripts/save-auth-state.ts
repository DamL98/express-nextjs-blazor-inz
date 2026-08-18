import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "@playwright/test";

type ScriptArguments = {
  endpoint: string;
  outputFile: string;
};

/** pobiera endpoint Chrome i plik docelowy z argumentów tego skryptu */
function readScriptArguments(): ScriptArguments {
  const [, , endpoint, outputFile] = process.argv;

  if (!endpoint || !outputFile) {
    throw new Error(
      "Użycie: npm run auth:save-state -- <CDP endpoint> <output file>",
    );
  }

  return { endpoint, outputFile };
}

function getBrowserContext(contexts: BrowserContext[]): BrowserContext {
  const context = contexts[0];

  if (!context) {
    throw new Error("Chrome nie udostępnił żadnego kontekstu przeglądarki.");
  }

  return context;
}

/** otwarte strony do sprawdzenia wybranej sesji */
async function printOpenPages(pages: Page[]): Promise<void> {
  console.log("Otwarte strony:");

  for (const page of pages) {
    console.log(`- ${await page.title()} — ${page.url()}`);
  }
}

/** łączy się z Chrome przez CDP i zapisuje stan logowania używany przez testy Playwright */
async function main(): Promise<void> {
  const { endpoint, outputFile } = readScriptArguments();
  const browser = await chromium.connectOverCDP(endpoint);

  try {
    const context = getBrowserContext(browser.contexts());
    await printOpenPages(context.pages());
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await context.storageState({ path: outputFile });
    console.log(`Zapisano stan sesji: ${outputFile}`);
  } finally {
    await browser.close();
  }
}

await main();
