import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const starters = join(root, "starters");
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "templates");

/** Registry versions for scaffolds created outside the monorepo. */
const REGISTRY = {
  "@kumooo/ui": "^0.1.0",
  "@kumooo/brand": "^0.1.0",
  "@kumooo/theme-packs": "^0.1.0",
  "@kumooo/framework": "^0.1.0",
  "@kumooo/plans": "^0.5.0",
};

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (name === "node_modules" || name === ".next" || name === "dist" || name === ".open-next") continue;
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) copyDir(from, to);
    else cpSync(from, to);
  }
}

function rewriteWorkspaceDeps(pkgPath) {
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const [key, value] of Object.entries(deps)) {
      if (typeof value === "string" && value.startsWith("workspace:")) {
        deps[key] = REGISTRY[key] ?? "latest";
      }
    }
  }
  // Scaffolds are apps, not monorepo packages
  delete pkg.private;
  if (pkg.scripts?.build?.includes("node_modules/next")) {
    pkg.scripts.build = "next build";
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

if (!existsSync(starters)) {
  console.error("starters/ not found at", starters);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const name of ["blank", "blog", "shop"]) {
  copyDir(join(starters, name), join(out, name));
  rewriteWorkspaceDeps(join(out, name, "package.json"));
  console.log("synced", name);
}
