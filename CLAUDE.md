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
| `/archive` | `archive.vue` | Instagram video gallery. Editorial grid layout, infinite scroll. SSR for meta tags, videos load client-side. |
| `/privacy-policy` | `privacy-policy.vue` | Privacy policy |
| `/nb-order-form` | `nb-order-form.vue` | Tally embed, landing layout, noindex |
| `/live-love-lightspeed` | `live-love-lightspeed.vue` | Old event page, not actively used |

## Route rules

```js
'/':             { prerender: true }
'/join':         { prerender: true }
'/shop':         { prerender: false }   // SSR on demand — products change
'/shop/**':      { prerender: false }   // SSR on demand — OG/meta for crawlers
'/archive':      { prerender: false }   // SSR for meta tags, videos load client-side
'/success':      { ssr: false }
'/nb-order-form':{ ssr: false }
```

## D1 database

**products** table: `id, slug, title, material (JSON), sizing (JSON), size_chart (JSON), description, price (cents), stripe_product_id, stripe_price_id`

**stock** table: `id, product_slug, size, quantity` — negative quantity = preorder

**instagram_token** table: `id, token, expires_at, updated_at` — single row (id=1). Stores the Instagram long-lived access token. The API route auto-refreshes it when within 7 days of expiry.

**instagram_cache** table: `id, videos, cached_at` — single row (id=1). Stores all fetched videos as a JSON blob. TTL: 30 minutes. On cache miss, fetches all pages from Instagram API and writes here.

> D1 tables are defined in `d1/schema.sql` but the file has `DROP TABLE IF EXISTS` guards at the top — **never run the full schema file against remote**, only the specific `CREATE TABLE` statements. Use `wrangler d1 execute --remote --command "CREATE TABLE IF NOT EXISTS ..."`.

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
| `GET /api/instagram` | `instagram.js` | Returns paginated videos from D1 cache. `?offset=N` for pagination. |

## Stripe flow

Cart (Pinia, localStorage) → POST `/api/checkout` → Stripe hosted checkout → `/success?session_id=...` → webhook decrements D1 stock

## SEO setup

- `app.vue` sets a global `titleTemplate` that appends `· JUOKSUT` — **don't add it manually** in page titles
- Exception: homepage uses `titleTemplate: null` to render as plain `JUOKSUT`
- `ogTitle` is separate from `title` and **should** include `· JUOKSUT` explicitly
- Canonical `siteUrl` is `https://juoksut.run` (root, no www — Cloudflare redirects www → root)
- Default social image: `https://cdn.juoksut.run/og-image.jpg` (1200×630 JPG)
- Product pages have JSON-LD Product schema for Google rich results

## Instagram API

The archive page pulls videos from the JUOKSUT Instagram account via the Instagram Graph API (Instagram Login product — no Facebook Page required).

**Token setup (one-time):**
1. Create a Meta app at developers.facebook.com → Instagram → Instagram Login for Business
2. Connect the JUOKSUT Instagram account and generate a user token with `instagram_basic` + `user_media` permissions
3. The token from the dashboard is already long-lived (~60 days). No exchange needed.
4. Store in D1: `wrangler d1 execute --remote juoksut-products --command "INSERT OR REPLACE INTO instagram_token (id, token, expires_at) VALUES (1, '<token>', '<ISO-date>')"`

**Auto-refresh:** `server/api/instagram.js` checks expiry on every cache-miss request. If within 7 days, calls `graph.instagram.com/refresh_access_token` and updates D1. Set it once, it maintains itself.

**Archive page layout:** Editorial row-based grid inspired by minjae.kim — intentional empty columns, varied widths, randomized order on every page load. Mobile gets a simpler 1–2 column layout. Infinite scroll via IntersectionObserver + offset pagination (`PAGE_SIZE = 12`).

**SSR note:** `useFetch('/api/instagram')` during SSR loses `event.context.cloudflare` (same D1 issue as products). Videos load client-side only via `onMounted`. This is acceptable — the page SSR still renders meta tags for crawlers.

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
