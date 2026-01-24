# Juoksut Run Club Website

Official website and shop for Juoksut Run Club (Helsinki, Finland).

Live site: https://juoksut.run/

## Overview

This Nuxt 3 app powers both the public site and the shop. It runs on Cloudflare Pages with a Cloudflare D1 database and integrates Stripe Checkout for payments. Some routes are pre-rendered for speed, while the shop pages are client-rendered for a smooth cart and checkout experience.

## Features

- Website pages for runs, events, and info
- Shop with cart, sizes, stock, and preorders
- Stripe Checkout + webhook to adjust stock in D1
- Cloudflare Pages hosting, Cloudflare D1 database
- Pinia store with local persistence for the cart
- Image optimization via `@nuxt/image` (CDN assets)
- SEO via `@nuxtjs/sitemap` and `@nuxtjs/robots`

## Tech stack

- Nuxt 3 (Vue 3, Nitro)
- Tailwind CSS
- Pinia + pinia-plugin-persistedstate
- Stripe (server SDK + Stripe.js)
- Cloudflare Pages + Functions, Cloudflare D1
- Yarn 4 • Node 20

## Prerequisites

- Node 20+
- Yarn 4
- Cloudflare Wrangler (for D1 and Pages preview)
- Stripe CLI (optional, for local webhook testing)

## Getting started

1. Clone and install

```bash
git clone https://github.com/jusa-a/juoksut.git
cd juoksut
yarn install
```

2. Environment variables

Create a `.env` file in the project root (Nuxt loads it in dev). At minimum:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # only required if you verify webhooks locally
```

You can also set variables in Cloudflare Pages (Project settings → Variables) and/or in `wrangler.toml` for local/preview builds.

3. Database (Cloudflare D1)

- One-time local setup:
  - Create a local DB (name matches project config):
    ```bash
    npx wrangler d1 create juoksut-products
    ```
  - Apply schema and seed (scripts provided):
    ```bash
    yarn db:reset:local
    # or just seed:
    yarn db:seed:local
    ```
- Remote (production) DB: use `--remote` with the same SQL files as needed.

4. Run the app

```bash
yarn dev --host
```

By default the app runs at http://localhost:3000. Shop routes (`/shop/**`) are client-rendered; the homepage and some static pages are pre-rendered.

## Stripe integration

- Checkout session creation: `server/api/checkout.js`
- Order details page data: `server/api/order-details.js`
- Webhook (stock update after successful checkout): `server/api/stripe-webhook.js`

Local webhook testing (optional):

```bash
# Start Nuxt in one terminal
yarn dev

# In another terminal, forward Stripe events and capture the webhook secret
stripe listen --forward-to localhost:3000/api/stripe-webhook
# Copy the printed Webhook signing secret and set STRIPE_WEBHOOK_SECRET in .env
```

## SEO: sitemap and robots

Configured in `nuxt.config.ts` using `@nuxtjs/sitemap` and `@nuxtjs/robots`.

- Public site URL for canonical links and sitemap: `runtimeConfig.public.siteUrl`
- Sitemap available at `/sitemap.xml` (some utility routes excluded)
- Robots served at `/robots.txt`

Adjust exclusions and defaults directly in `nuxt.config.ts` if you add routes.

## Build, preview, deploy

- Build (Cloudflare Pages preset):
  ```bash
  yarn build
  ```
- Preview with Cloudflare Pages locally:
  ```bash
  yarn preview
  ```
- Deploy on Cloudflare Pages:
  - Connect the repo and set the build command to `yarn build`
  - Output directory is `dist` (see `wrangler.toml`)
  - Add environment variables (Stripe keys) and bind the D1 database (binding name: `D1`)

## Scripts

- `yarn dev` – Run dev server
- `yarn build` – Build for Cloudflare Pages
- `yarn preview` – Build then run Pages preview
- `yarn lint` / `yarn lint:fix` – Lint code
- `yarn db:reset:local` – Apply schema and seed to local D1
- `yarn db:seed:local` – Seed local D1
- `yarn dev:fresh` – Reset local DB then start dev

## Project layout (highlights)

- `pages/` – Site and shop routes
- `server/api/` – Server routes (checkout, products, webhook, etc.)
- `server/utils/productUtils.js` – Product fetch/transform utilities
- `stores/` – Pinia stores (`cart`, `products`)
- `d1/` – SQL schema and seed data for Cloudflare D1
- `nuxt.config.ts` – Modules, SEO, route rules, and runtime config

## Troubleshooting

- Webhook signature verification fails: ensure `STRIPE_WEBHOOK_SECRET` is set when testing locally with Stripe CLI.
- D1 errors locally: make sure the DB exists and you ran the schema/seed scripts; check the binding name `D1` in `wrangler.toml`.
- Product images missing: assets are fetched from `https://cdn.juoksut.run/products/{slug}/`; confirm images exist at the CDN.
- Node/Yarn mismatch: use Node 20 and Yarn 4 (the project uses Yarn Berry via `packageManager`).

## License

MIT — see `LICENSE`.

## Contact

Questions or feedback: [crew@juoksut.run](mailto:crew@juoksut.run)
