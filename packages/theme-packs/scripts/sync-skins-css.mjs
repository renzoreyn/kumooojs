import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = join(root, "src/skins.css");
const outPath = join(root, "src/skins-css.ts");
const check = process.argv.includes("--check");

const css = readFileSync(cssPath, "utf8");
const body =
  "/** Synced from skins.css for Worker injection. Run: pnpm --filter @kumooo/theme-packs sync-skins-css */\n" +
  `export const SKINS_CSS = ${JSON.stringify(css)};\n`;

if (check) {
  let existing = "";
  try {
    existing = readFileSync(outPath, "utf8");
  } catch {
    console.error("skins-css.ts missing; run: pnpm --filter @kumooo/theme-packs sync-skins-css");
    process.exit(1);
  }
  if (existing !== body) {
    console.error("skins-css.ts out of sync with skins.css; run: pnpm --filter @kumooo/theme-packs sync-skins-css");
    process.exit(1);
  }
  console.log("skins-css.ts in sync");
  process.exit(0);
}

writeFileSync(outPath, body);
console.log("synced skins-css.ts");
