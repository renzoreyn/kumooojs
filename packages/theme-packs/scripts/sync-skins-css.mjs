import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/skins.css"), "utf8");
const body =
  "/** Synced from skins.css for Worker injection. Run: pnpm --filter @kumooo/theme-packs sync-skins-css */\n" +
  `export const SKINS_CSS = ${JSON.stringify(css)};\n`;
writeFileSync(join(root, "src/skins-css.ts"), body);
console.log("synced skins-css.ts");
