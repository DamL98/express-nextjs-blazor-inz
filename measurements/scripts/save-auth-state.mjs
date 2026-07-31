import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const [, , endpoint, outputFile] = process.argv;

if (!endpoint || !outputFile) {
  console.error(
    "Użycie: node scripts/save-auth-state.mjs <CDP endpoint> <output file>",
  );
  process.exit(1);
}

const browser = await chromium.connectOverCDP(endpoint);

try {
  const contexts = browser.contexts();

  if (contexts.length === 0) {
    throw new Error("Chrome nie udostępnił żadnego kontekstu przeglądarki.");
  }

  const context = contexts[0];
  const pages = context.pages();

  console.log("Otwarte strony:");
  for (const page of pages) {
    console.log(`- ${await page.title()} — ${page.url()}`);
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await context.storageState({ path: outputFile });

  console.log(`Zapisano stan sesji: ${outputFile}`);
} finally {
  await browser.close();
}