# Juoksut Run Club Website

Official website and shop for Juoksut Run Club (Helsinki, Finland).

Live site: https://juoksut.run/

## Overview

This Nuxt 4 app powers both the public site and the shop. It runs on Cloudflare
Pages with a Cloudflare D1 database and Stripe Checkout for payments. Static
pages are pre-rendered; shop pages are rendered on demand at the edge so their
product and social metadata stay current.

## Features

- Website pages for runs, events, and info
- Shop with cart, sizes, stock, and preorders
- Stripe Checkout with customer name and phone collection; signed webhooks adjust stock in D1
- Cloudflare Pages hosting, Cloudflare D1 database, and R2-backed media CDN
- Pinia store with local persistence for the cart
- Image optimization via `@nuxt/image` (CDN assets)
- Static, hand-maintained sitemap and robots files

## Tech stack

- Nuxt 4 (Vue 3, Nitro)
- Tailwind CSS
- Pinia + pinia-plugin-persistedstate
- Stripe (server SDK + Stripe.js)
- Cloudflare Pages + Functions, Cloudflare D1
- Yarn 4 • Node 22

## Prerequisites

- Node 22 (see `.nvmrc`)
- Yarn 4
- Cloudflare Wrangler (for D1 and Pages preview)
- Stripe CLI (optional, for local webhook testing)

## Getting started

1) Clone and install

```bash
git clone https://github.com/jusa-a/juoksut.git
cd juoksut
corepack yarn install
```

2) Environment variables

Create a `.env` file in the project root (Nuxt loads it in dev). At minimum:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # only required if you verify webhooks locally
```

Use a restricted Stripe API key for `STRIPE_MANAGEMENT_KEY`, not the checkout
server key. Give it only the permissions required for inspection (normally
read-only Products, Prices, Checkout Sessions, Events, and Customers). Store
the management key in macOS Keychain, not `.dev.vars`:

```bash
security add-generic-password -U -a "$(id -un)" -s juoksut-stripe-management-test -w
```

The checked-in wrapper exposes it only to the command it runs:

```bash
bash scripts/stripe-management.sh node scripts/stripe-inspect.mjs catalog
```

Keep a test-mode key for normal development. A live restricted key should use
the service name `juoksut-stripe-management-live` and only be used for an
explicitly approved production task.

Production checkout secrets belong in Cloudflare Pages (Project settings →
Variables), never in `wrangler.toml` or the repository. `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET` are server-only secrets.

### Cloudflare CLI access (optional)

Remote D1, Pages, and R2 operations use a Cloudflare API token. Create a
restricted token in the Cloudflare dashboard and store it in the macOS Keychain
instead of a repository file or shell history:

```bash
security add-generic-password -U -a "$(id -un)" -s juoksut-cloudflare-api-token -w
```

Enter the token when prompted. Use the wrapper for remote commands; it supplies
the token and the Juoksut account id only to Wrangler:

```bash
bash scripts/wrangler-remote.sh d1 execute juoksut-products --remote --command "SELECT 1"
```

Restrict the token to the **JUOKSUT Cloudflare account** and only the required
resources. Grant only the permissions needed: **D1 Edit** for migrations and
stock/product changes, **Pages/Workers Edit** for deployments, and **R2 Object
Read/Write** only when managing images. A read-only token is preferable for
inspection. Never run `d1/schema.sql` against `--remote`; use a specific
migration instead.

These Keychain service names and wrapper commands are safe to document in a
public repository. Token values, Stripe secret keys, webhook signing secrets,
Keychain output, and customer data are not. Use live access only for a
user-authorised, specific production operation.

3) Database (Cloudflare D1)

- One-time local setup:
  - Create a local DB (name matches project config):
    ```bash
    npx wrangler d1 create juoksut-products
    ```
  - Apply schema and seed (scripts provided):
    ```bash
    corepack yarn db:reset:local
    # or just seed:
    corepack yarn db:seed:local
    ```
- Remote (production) DB: use the Keychain-backed wrapper with a specific,
  reviewed migration or statement. Do not apply the local reset schema or seed
  file remotely.

4) Run the app

```bash
corepack yarn dev --host
```

By default the app runs at http://localhost:3000. `/shop` and `/shop/**` are
on-demand SSR; the homepage and selected static pages are pre-rendered.

## Stripe integration

- Checkout session creation: `server/api/checkout.js`
- Order details page data: `server/api/order-details.js`
- Webhook (stock update and reservation lifecycle): `server/api/stripe-webhook.js`

Checkout always re-reads prices from D1. It collects name, email and phone in
Stripe and creates Stripe Customers. Product-specific structured answers (for
example camp shirt size) are configured in `products.checkout_fields` and appear
as required Stripe Checkout dropdowns.

For a capacity-limited registration, set `reserve_stock = 1`: stock is held
before Checkout, the session expires after ten minutes, and the signed webhook
marks the hold paid on completion or releases it on expiry. `sales_start_at` is
an optional Unix timestamp that the product page counts down to and the server
enforces. The live webhook destination must subscribe to both
`checkout.session.completed` and `checkout.session.expired`.

Local webhook testing (optional):

```bash
# Start Nuxt in one terminal
corepack yarn dev

# In another terminal, forward Stripe events and capture the webhook secret
stripe listen --forward-to localhost:3000/api/stripe-webhook
# Copy the printed Webhook signing secret and set STRIPE_WEBHOOK_SECRET in .env
```

## SEO: sitemap and robots

`public/sitemap.xml` and `public/robots.txt` are static, hand-maintained files.

- Public site URL for canonical links and sitemap: `runtimeConfig.public.siteUrl`
- Sitemap available at `/sitemap.xml` (some utility routes excluded)
- Robots served at `/robots.txt`

Update `public/sitemap.xml` when a public route is added or removed.

## Build, preview, deploy

- Build (Cloudflare Pages preset):
  ```bash
  corepack yarn build
  ```
- Preview with Cloudflare Pages locally:
  ```bash
  corepack yarn preview
  ```
- Deploy on Cloudflare Pages:
  - Connect the repo and set the build command to `corepack yarn build`
  - Output directory is `dist` (see `wrangler.toml`)
  - Add environment variables (Stripe keys) and bind the D1 database (binding name: `D1`)

## Scripts

- `corepack yarn dev` – Run dev server
- `corepack yarn build` – Build for Cloudflare Pages
- `corepack yarn preview` – Build then run Pages preview
- `corepack yarn lint` / `corepack yarn lint:fix` – Lint code
- `corepack yarn test` – Run unit tests
- `corepack yarn db:reset:local` – Apply schema and local seed to local D1
- `corepack yarn db:seed:local` – Apply the local seed
- `corepack yarn dev:fresh` – Reset local DB then start dev

## Project layout (highlights)

- `pages/` – Site and shop routes
- `server/api/` – Server routes (checkout, products, webhook, etc.)
- `server/utils/productUtils.js` – Product fetch/transform utilities
- `stores/` – Pinia stores (`cart`, `products`)
- `d1/` – Committed schema plus a local-only, ignored seed file
- `nuxt.config.ts` – Modules, SEO, route rules, and runtime config

## Troubleshooting

- Webhook signature verification fails: ensure `STRIPE_WEBHOOK_SECRET` is set when testing locally with Stripe CLI.
- D1 errors locally: make sure the DB exists and you ran the schema/seed scripts; check the binding name `D1` in `wrangler.toml`.
- Product images missing: assets are fetched from `https://cdn.juoksut.run/products/{slug}/`; confirm images exist at the CDN.
- Node/Yarn mismatch: use Node 22 and Yarn 4 through Corepack (the exact version is in `packageManager`).

## License

MIT — see `LICENSE`.

## Contact

Questions or feedback: [crew@juoksut.run](mailto:crew@juoksut.run)
