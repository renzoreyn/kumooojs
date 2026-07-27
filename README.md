# kumooo.js

Next.js starters and UI for Cloudflare Workers. Packages, theme packs, and `create-kumooo`.

The hosted product (dashboard, API, `kumooo.site`) is separate. This repo is what you run on your own account.

Docs: [docs.kumooo.dev](https://docs.kumooo.dev). Product: [kumooo.dev](https://kumooo.dev).

## Prerequisites

- Node.js 20+
- pnpm (or npm / bun)
- A [Cloudflare](https://dash.cloudflare.com/sign-up) account

Wrangler ships with the starters. You do not install it globally.

## Quick start (CLI)

```bash
npx create-kumooo my-site
cd my-site
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Choose blank, blog, or shop when asked.

`create-kumooo` pulls `@kumooo/*` from npm. Until those packages are published, clone this repo instead.

## Quick start (this repo)

```bash
git clone https://github.com/renzoreyn/kumooojs.git
cd kumooojs
pnpm install
pnpm dev:blank
```

`pnpm dev:blog` and `pnpm dev:shop` work the same way. Apps live under `starters/`.

## Deploy on your Cloudflare account

Starters build with [OpenNext](https://opennext.js.org/cloudflare) and deploy with Wrangler. You get a `*.workers.dev` URL.

### 1. Log in

From the starter directory:

```bash
pnpm exec wrangler login
```

### 2. Name the Worker

In `wrangler.jsonc`:

- Set `"name"` to a unique Worker name on your account (example: `my-site`).
- Set `services[0].service` to that same name. The Worker calls itself through that binding.

Keep `"workers_dev": true` unless you already have a custom domain plan.

### 3. Deploy

```bash
pnpm deploy
```

Runs `opennextjs-cloudflare build` then `opennextjs-cloudflare deploy`. Wrangler prints the live URL when it is done. Run the same command again after edits.

### From the monorepo root

```bash
pnpm --filter @kumooo/starter-blank deploy
```

Use `@kumooo/starter-blog` or `@kumooo/starter-shop` for the other starters.

### Custom domain

Cloudflare dashboard: Workers & Pages → your Worker → Settings → Domains & Routes. Details: [Custom domains](https://docs.kumooo.dev/docs/guides/custom-domains).

## Hosted on kumooo

No Cloudflare account of your own: [app.kumooo.dev](https://app.kumooo.dev). Sites land on `{slug}.kumooo.site`. Plans: [kumooo.dev/pricing](https://kumooo.dev/pricing).

## Layout

| Path | What |
| --- | --- |
| `packages/ui` | UI components |
| `packages/framework` | Framework helpers |
| `packages/theme-packs` | Skins |
| `packages/brand` | Brand tokens |
| `packages/plans` | Plan constants |
| `packages/blocks` | Builder blocks |
| `packages/create-kumooo` | Scaffold CLI |
| `starters/*` | blank, blog, shop |
| `apps/hosted-site` | Hosted site Worker template |

## License

MIT
