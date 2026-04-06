# CLAUDE.md

Project-specific context for Claude Code. See README for setup instructions.

## What this project is

JUOKSUT Run Club website and shop. Nuxt 3 SSR app on Cloudflare Pages with a D1 (SQLite) database and Stripe checkout.

## Architecture overview

```
pages/          → routes (see below)
server/api/     → Nitro API handlers (D1 + Stripe)
server/utils/   → productUtils.js (shared DB query + transform logic)
stores/         → Pinia: cart.js (persisted to localStorage), products.js
components/     → Nav, Cart, Footer, LoadingScreen, etc.
layouts/        → default.vue (Nav+Cart+Footer), landing.vue (minimal)
d1/             → schema.sql + seed.sql
```

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | `index.vue` | Hero video, values. Prerendered. Landing layout |
| `/join` | `join.vue` | Weekly runs, safer space policy. Prerendered |
| `/shop` | `shop/index.vue` | Product grid. SSR |
| `/shop/[slug]` | `shop/[...slug].vue` | Product detail, size picker, add to cart. SSR |
| `/fastlane-friday` | `fastlane-friday.vue` | Weekly speed session. Ticket Tailor embed |
| `/success` | `success.vue` | Post-checkout. Fetches order via Stripe session ID. CSR |
| `/cancel` | `cancel.vue` | Payment cancelled. CSR |
| `/orders` | `orders.vue` | Order policy, preorder info, T&C |
| `/archive` | `archive.vue` | Planned photo gallery (scraping IG feed or similar) — not implemented yet |
| `/privacy-policy` | `privacy-policy.vue` | Privacy policy |
| `/nb-order-form` | `nb-order-form.vue` | Tally embed, landing layout, noindex |
| `/live-love-lightspeed` | `live-love-lightspeed.vue` | Old event page, not actively used |

## Route rules

```js
'/':             { prerender: true }
'/join':         { prerender: true }
'/shop':         { prerender: false }   // SSR on demand — products change
'/shop/**':      { prerender: false }   // SSR on demand — OG/meta for crawlers
'/success':      { ssr: false }
'/nb-order-form':{ ssr: false }
```

## D1 database

**products** table: `id, slug, title, material (JSON), sizing (JSON), size_chart (JSON), description, price (cents), stripe_product_id, stripe_price_id`

**stock** table: `id, product_slug, size, quantity` — negative quantity = preorder

`server/utils/productUtils.js` has `fetchProductData(D1, slug?)` and `transformProductData(product)`. These are shared between API routes and the store's SSR path. Price is stored in cents, converted to euros in `transformProductData`.

## Critical: D1 access during SSR

**Never use `$fetch('/api/...')` in the Pinia store during SSR for D1 data.** Nitro creates a fresh sub-request event for internal fetches that does not inherit `event.context.cloudflare` — D1 is `undefined` in the API handler.

The fix (in `stores/products.js`): detect `import.meta.server` and call the DB utilities directly:

```js
if (import.meta.server) {
  const event = useRequestEvent()
  const D1 = event?.context?.cloudflare?.env?.D1
  if (D1) {
    const { fetchProductData, transformProductData } = await import('~/server/utils/productUtils.js')
    // query D1 directly, skip $fetch
  }
}
// $fetch works fine on the client
```

Client-side navigation uses `$fetch` to API routes normally — that's fine because it's a real HTTP request to the CF Worker.

## API routes

| Route | File | Notes |
|---|---|---|
| `GET /api/products` | `products.js` | All products with stock |
| `GET /api/products/[slug]` | `products/[slug].js` | Single product |
| `GET /api/products/[slug]/images` | `products/[slug]/images.js` | Probes CDN for images 2–7, no D1 |
| `POST /api/checkout` | `checkout.js` | Validates stock, creates Stripe session (30 min expiry) |
| `GET /api/order-details` | `order-details.js` | Fetches Stripe session by `session_id` |
| `POST /api/stripe-webhook` | `stripe-webhook.js` | Batch-updates D1 stock on `checkout.session.completed` |

## Stripe flow

Cart (Pinia, localStorage) → POST `/api/checkout` → Stripe hosted checkout → `/success?session_id=...` → webhook decrements D1 stock

## SEO setup

- `app.vue` sets a global `titleTemplate` that appends `· JUOKSUT` — **don't add it manually** in page titles
- Exception: homepage uses `titleTemplate: null` to render as plain `JUOKSUT`
- `ogTitle` is separate from `title` and **should** include `· JUOKSUT` explicitly
- Canonical `siteUrl` is `https://www.juoksut.run` (with www)
- Default social image: `https://cdn.juoksut.run/og-image.jpg` (1200×630 JPG)
- Product pages have JSON-LD Product schema for Google rich results

## Secrets and config

- `wrangler.toml` is committed — D1 binding config only, no secrets
- Local dev secrets go in `.dev.vars` (gitignored): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BASE_URL`
- Production secrets set in Cloudflare Pages dashboard (Settings → Environment variables)

## Known issues / TODO

- Product descriptions in D1 are missing spaces after periods (e.g. `Lightspeed.Heavyweight`). Needs fixing in the database content directly.

## Branch workflow

Work in feature branches — Cloudflare Pages auto-builds previews for non-main branches. Verify the preview before merging to main.

```bash
git checkout -b feat/my-change
git push -u origin feat/my-change
# check preview at *.juoksut.pages.dev, then:
git checkout main && git merge feat/my-change && git push
```

## Linting

`@antfu/eslint-config` — enforces consistent property quoting, import order, etc. Run `yarn lint:fix` before committing if you see lint errors. `useHead`, `useSeoMeta`, `$fetch` etc. show as "undefined" in the linter but are Nuxt auto-imports — these warnings are false positives.
