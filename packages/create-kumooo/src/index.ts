#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import * as p from "@clack/prompts";
import pc from "picocolors";

const STARTERS = ["blank", "blog", "shop"] as const;
type Starter = (typeof STARTERS)[number];

const here = dirname(fileURLToPath(import.meta.url));

function templatesRoot(): string {
  const bundled = join(here, "..", "templates");
  if (existsSync(bundled)) return bundled;
  // Monorepo fallback: ../../starters
  return join(here, "..", "..", "..", "starters");
}

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (name === "node_modules" || name === ".next" || name === "dist") continue;
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) copyDir(from, to);
    else cpSync(from, to);
  }
}

function rewritePackageName(pkgPath: string, name: string) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    name: string;
    private?: boolean;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  pkg.name = name;
  delete pkg.private;
  const registry: Record<string, string> = {
    "@kumooo/ui": "^0.1.0",
    "@kumooo/brand": "^0.1.0",
    "@kumooo/theme-packs": "^0.1.0",
    "@kumooo/framework": "^0.1.0",
    "@kumooo/plans": "^0.5.0",
  };
  for (const field of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const key of Object.keys(deps)) {
      const value = deps[key];
      if (key.startsWith("@kumooo/") && value?.startsWith("workspace:")) {
        deps[key] = registry[key] ?? "latest";
      }
    }
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function main() {
  console.log();
  p.intro(pc.cyan("create-kumooo") + pc.dim(" - kumooo.js on Next.js"));

  const argName = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2] : undefined;

  const name = argName
    ? argName
    : await p.text({
        message: "Project name",
        placeholder: "my-app",
        defaultValue: "my-app",
        validate: (v) => (!v || !/^[a-z0-9-_]+$/i.test(v) ? "Use letters, numbers, - or _" : undefined),
      });

  if (p.isCancel(name)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }

  const starter = await p.select({
    message: "Starter",
    options: [
      { value: "blank", label: "Blank", hint: "Minimal App Router + @kumooo/ui" },
      { value: "blog", label: "Blog", hint: "Posts list + detail" },
      { value: "shop", label: "Shop", hint: "Catalog + demo bag" },
    ],
  });

  if (p.isCancel(starter)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }

  const target = resolve(process.cwd(), String(name));
  if (existsSync(target) && readdirSync(target).length > 0) {
    p.cancel(`Directory ${name} is not empty.`);
    process.exit(1);
  }

  const src = join(templatesRoot(), starter as Starter);
  if (!existsSync(src)) {
    p.cancel(`Starter template missing: ${src}`);
    process.exit(1);
  }

  const spin = p.spinner();
  spin.start(`Scaffolding ${starter} → ${name}`);
  copyDir(src, target);
  rewritePackageName(join(target, "package.json"), String(name));
  spin.stop("Files ready");

  const install = await p.confirm({
    message: "Install dependencies with pnpm?",
    initialValue: true,
  });

  if (!p.isCancel(install) && install) {
    spin.start("pnpm install");
    const r = spawnSync("pnpm", ["install"], { cwd: target, stdio: "inherit", shell: true });
    spin.stop(r.status === 0 ? "Installed" : "Install finished with errors");
  }

  p.outro(
    [
      pc.green("Done."),
      "",
      `  cd ${name}`,
      "  pnpm dev",
      "",
      pc.dim("Built on Next.js. Kumooo adds kits, UI, and (soon) Cloudflare + hosting."),
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
