# CLAUDE.md

Project-specific context for Claude Code. See `README.md` for end-user setup and
`docs/` for the deep audit (`architecture.md`, `security-review.md`, `roadmap.md`).

## What this project is

JUOKSUT Run Club website + shop (Helsinki). A Nuxt 4 (Vue 3 + Nitro) SSR app deployed on
**Cloudflare Pages**, backed by **Cloudflare D1** (SQLite — holds only product/stock + a couple of
Instagram bookkeeping rows) and **Cloudflare R2** served via the `cdn.juoksut.run` CDN (all images
and videos). **Stripe Checkout** handles merch payments and is the **system of record** for
payments, orders and customer PII — no personal/member data is stored in this app's own infra.

Event registration/ticketing is **not** first-party: it runs through third-party embeds
(Ticket Tailor, Tally, Google Forms — see "Event registration / ticketing" below).

The codebase is deliberately hand-rolled and sparsely commented — built solo, need-by-need, over
years. Prefer documenting and proposing over rewriting; don't swap hand-rolled solutions for
libraries/frameworks without asking.

## Commands & local dev

Node **22** (`.nvmrc`). Package manager is **Yarn 4** via Corepack. In a non-interactive shell
`yarn` may not be on `PATH` — use `corepack yarn …`. `node_modules` is **not** checked in and may be
absent; run an install first.

```bash
corepack yarn install              # install deps (creates node_modules; nodeLinker: node-modules)
corepack yarn dev                  # Nuxt dev server (http://localhost:3000)
corepack yarn dev:fresh            # reset local D1 (schema+seed) then dev
corepack yarn lint                 # eslint (@antfu/eslint-config)
corepack yarn lint:fix             # autofix
corepack yarn build                # nuxt build --preset=cloudflare_pages  → dist/
corepack yarn preview              # build + wrangler pages dev (local Pages runtime w/ D1)
corepack yarn npm audit --all      # dependency vulnerability audit

# Local D1 (Wrangler):
corepack yarn db:reset:local       # apply d1/schema.sql then d1/seed.sql to LOCAL db
corepack yarn db:seed:local        # seed only
```

Local secrets live in `.dev.vars` (gitignored): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`BASE_URL`. **`BASE_URL` is currently unused by the code** (redirect URLs are derived from the
request origin — `server/api/checkout.js`). Production secrets are set in the Cloudflare Pages
dashboard (Settings → Environment variables). Only `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
are read by server code.

## Repo structure

```
pages/          → routes (see table below)
server/api/     → Nitro API handlers (D1 + Stripe + Instagram)
server/utils/   → productUtils.js (shared D1 query + transform logic)
stores/         → Pinia: cart.js (persisted to localStorage), products.js
components/     → Nav, LandingNav, Cart, Footer, FooterVideo, LoadingScreen, Divider
layouts/        → default.vue (Nav + Cart + Footer), landing.vue (LandingNav + FooterVideo + Footer)
assets/css/     → tailwind.css (fonts, base styles, --nav-height CSS var, global cursor)
d1/             → schema.sql (committed) + seed.sql (local-only, ignored)
public/         → static assets, favicons, sitemap.xml, site.webmanifest
app.vue         → root: LoadingScreen + NuxtLayout + global SEO/title template
error.vue       → error page (statusCode/statusMessage + "go home")
```

> `d1/schema.sql` is committed as the recoverable schema source of truth. `d1/seed.sql` is ignored
> intentionally because it is local development data; do not assume it represents production.

## Pages

| Route                   | File                       | Notes                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                     | `index.vue`                | Hero video (random latest Instagram VIDEO, client-side via `onMounted`; falls back to `cdn.juoksut.run/juoksut.mp4`), values. **Prerendered**. Default layout; `titleTemplate: null` renders plain `JUOKSUT` (the original CLAUDE.md said "landing layout" — that was wrong; only `nb-order-form` and `live-love-lightspeed` use the landing layout) |
| `/join`                 | `join.vue`                 | Weekly runs, safer-space policy, external Google Form for reports. **Prerendered**                                                                                                                                                                                                                                                                   |
| `/shop`                 | `shop/index.vue`           | Product grid (sorted by id desc) + a Fastlane Friday card. SSR                                                                                                                                                                                                                                                                                       |
| `/shop/[slug]`          | `shop/[...slug].vue`       | Product detail, size picker, add-to-cart, JSON-LD Product schema. SSR. Catch-all (`[...slug]`); uses `slug[0]`                                                                                                                                                                                                                                       |
| `/fastlane-friday`      | `fastlane-friday.vue`      | Weekly speed session. **Ticket Tailor** widget injected on click (5s fallback link)                                                                                                                                                                                                                                                                  |
| `/success`              | `success.vue`              | Post-checkout. `useFetch('/api/order-details')` by `session_id`. **CSR** (`ssr: false`); clears cart                                                                                                                                                                                                                                                 |
| `/cancel`               | `cancel.vue`               | Payment cancelled. Static. **Does not clear the cart**                                                                                                                                                                                                                                                                                               |
| `/terms-and-conditions` | `terms-and-conditions.vue` | Terms & Conditions: order policy, preorder info, and trip terms. `robots: noindex`; `/orders` permanently redirects here.                                                                                                                                                                                                                               |
| `/archive`              | `archive.vue`              | Instagram video gallery, editorial grid, infinite scroll. SSR for meta tags                                                                                                                                                                                                                                                                          |
| `/privacy-policy`       | `privacy-policy.vue`       | Privacy policy. `robots: noindex`                                                                                                                                                                                                                                                                                                                    |
| `/nb-order-form`        | `nb-order-form.vue`        | **Tally** iframe embed, landing layout, `noindex`. CSR (`ssr: false`)                                                                                                                                                                                                                                                                                |
| `/live-love-lightspeed` | `live-love-lightspeed.vue` | Legacy event page (Google Forms hidden-iframe POST). Not actively used; contains dead/commented code                                                                                                                                                                                                                                                 |

## Route rules (`nuxt.config.ts`)

```js
'/':              { prerender: true }
'/join':          { prerender: true }
'/shop':          { prerender: false }   // SSR on demand — products change
'/shop/**':       { prerender: false }   // SSR on demand — OG/meta for crawlers
'/archive':       { prerender: false }   // SSR for meta tags
'/success':       { ssr: false }
'/nb-order-form': { ssr: false }
```

## D1 database (`juoksut-products`, binding `D1`)

Defined in committed `d1/schema.sql`. Six tables:

- **products** — `id, slug (UNIQUE), title, material (JSON), sizing (JSON), size_chart (JSON),
description, price (INTEGER cents), stripe_product_id, stripe_price_id, checkout_fields, reserve_stock,
sales_start_at`.
  The two `stripe_*` columns are **optional**; most products leave them NULL. `checkout_fields` is
  a JSON array of required product-specific Stripe dropdowns, for example a camp shirt size.
- **stock** — `id, product_slug (FK→products.slug ON DELETE CASCADE), size, quantity`. **Negative
  quantity = preorder/"coming soon"** (intentional; there is no `CHECK`/floor on quantity). A unique
  `(product_slug, size)` index prevents duplicate stock rows and speeds stock reads/updates.
- **instagram_token** — single row (`id=1`): `token, expires_at, updated_at`. Long-lived IG token;
  auto-refreshed when within 7 days of expiry.
- **instagram_cache** — single row (`id=1`): `videos (JSON blob), cached_at`. 30-min TTL.
- **processed_events** — Stripe event ids already applied by the webhook, preventing duplicate stock
  decrements when Stripe retries delivery.
- **checkout_reservations** — short-lived capacity holds for products with `reserve_stock = 1`;
  contains product/stock references and Stripe's random checkout reference, never buyer PII.

`server/utils/productUtils.js`:

- `fetchProductData(D1, slug?)` — one query with `LEFT JOIN stock` + `JSON_GROUP_ARRAY` (sizes
  ordered XXS→XXL). **Gotcha:** a product with zero stock rows yields a phantom
  `[{"size":null,"quantity":null}]` entry rather than `[]`.
- `transformProductData(product)` — parses JSON columns, converts `price` cents→euros, sets
  `img = {cdn}/products/{slug}/1.png`, and renders the description: `description.split('\n')`
  → wraps each chunk in `<p>`. **Descriptions mix two line-break conventions**: literal `\n`
  (split into paragraphs) and `<br>` (preserved and rendered via `v-html`). Both appear in seed data.

> `d1/schema.sql` has `DROP TABLE IF EXISTS` guards for products/stock at the top — **never run the
> full schema file against `--remote`**. Apply specific `CREATE TABLE IF NOT EXISTS …` /
> `ALTER TABLE …` statements via `wrangler d1 execute --remote juoksut-products --command "…"`.
> There is **no admin/stock-write HTTP endpoint** — product/stock edits are done out-of-band with
> `wrangler d1 execute`. The camp reservation checkout flow and signed Stripe webhook are the only
> programmatic stock mutators.

## Critical: D1 access during SSR

Prefer direct D1 access from the Pinia store during SSR rather than an internal `$fetch('/api/...')`.
The direct path retains the original request context and avoids relying on framework-specific
sub-request behavior.

Fix (in `stores/products.js`): detect `import.meta.server`, grab `useRequestEvent()`, read
`event.context.cloudflare.env.D1`, and call the DB utilities directly — skip `$fetch`. Client-side
navigation uses `$fetch`/`useFetch` to the real API routes normally.

> **Verified (2026-06):** `pages/archive.vue` calls `useFetch('/api/instagram')` at setup during SSR
> and the binding is available in the current runtime. The store's direct-D1 path is therefore a
> conservative compatibility choice, not evidence that all internal fetches fail.

## API routes (`server/api/`)

| Route                             | File                        | Notes                                                                                          |
| --------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /api/products`               | `products.js`               | All products with stock                                                                        |
| `GET /api/products/[slug]`        | `products/[slug].js`        | Single product; preserves a genuine 404                                                        |
| `GET /api/products/[slug]/images` | `products/[slug]/images.js` | Probes CDN (HEAD) for images 2–7. No D1; uses the runtime `fetch`                             |
| `POST /api/checkout`              | `checkout.js`               | Validates stock + re-reads price from D1, reserves configured registrations, creates a 10-min Stripe session |
| `GET /api/order-details`          | `order-details.js`          | Fetches Stripe session by `session_id`; returns only name and email for the success page       |
| `POST /api/stripe-webhook`        | `stripe-webhook.js`         | Verifies signature, finalises/releases reservations, updates merch stock on completion         |
| `GET /api/instagram`              | `instagram.js`              | Paginated videos from D1 cache (`?offset=N`); refreshes token + repopulates cache on miss      |

## Stripe flow

Cart (Pinia → localStorage) → `Cart.vue` `useFetch('POST /api/checkout', { items })` →
server validates stock + **re-reads price from D1** (never trusts client price) → Stripe hosted
checkout → configured registrations atomically hold a place → `window.location.href = session.url`
→ `/success?session_id=…` → Stripe fires `checkout.session.completed` → webhook decrements normal
merch stock or marks the pre-held registration paid.

**Two pricing paths in `checkout.js`:**

1. **Inline `price_data`** (most products, `stripe_price_id` NULL): server sets
   `product_data.metadata = { slug, size }` so the webhook can map the line item back to D1 stock.
2. **Pre-created `stripe_price_id`** (event/trip registrations may use this): the line item is just
   `{ price, quantity }`. The webhook looks up its D1 product by Stripe price id *before*
   considering Stripe metadata, so stale or missing dashboard metadata cannot misdirect stock.
   The D1 mapping is unique. Size falls back to `'ONE-SIZE'`.

Checkout validates the cart shape and re-reads all prices from D1. It requires the buyer's name and
phone number and sets `customer_creation: 'always'`, so completed payments also create Stripe
Customer records. Product `checkout_fields` become required Stripe dropdowns; registrations with
such fields can only be purchased one at a time, ensuring one answer per participant. The optional
order note remains for unstructured information.

**Webhook gotchas** (`stripe-webhook.js`):

- Signature is verified with `constructEventAsync` over the raw body. A missing webhook secret fails
  loudly instead of acknowledging the event.
- The webhook claims `processed_events.id` before mutating stock, making retried Stripe events
  idempotent. On a failed update it releases the claim so Stripe can retry.
- A stock update that affects zero rows fails the webhook instead of silently accepting a missing
  product/size row.
- Decrement still has no floor (`quantity = quantity - ?`) for ordinary merchandise, so it can
  oversell under concurrent checkouts. Products with `reserve_stock = 1` are held atomically instead.
- Checkout sessions expire after **10 minutes** (`60 * 10`). A matching camp hold is finalised on
  `checkout.session.completed` or released on `checkout.session.expired`; the Stripe endpoint must
  subscribe to both events.
- `sales_start_at` is an optional Unix timestamp. The product page displays a countdown and the
  server rejects checkout before that instant, so sales can open automatically without a cron job.

## Event registration / ticketing (third-party — not first-party)

- **Fastlane Friday** (`fastlane-friday.vue`): Ticket Tailor widget script
  (`cdn.tickettailor.com/js/widgets/min/widget.js`) injected on "Sign Up" click; 5s fallback link.
- **nb-order-form** (`nb-order-form.vue`): Tally form iframe (`tally.so/embed/…`).
- **live-love-lightspeed** (legacy): posts to a Google Form via a hidden iframe.
- Trip registrations can use first-party Stripe Checkout. Required structured answers belong in the
  product's `checkout_fields` JSON configuration, not the free-text order note or stock sizes.

## R2 / CDN

Everything visual is served from **`cdn.juoksut.run`** (R2-backed): product images at
`/products/{slug}/{1..7}.png`, hero/footer video `/juoksut.mp4`, `og-image.jpg`,
`fastlane-friday.jpg`. `@nuxt/image` is configured with `domains: ['cdn.juoksut.run']`. The bucket
is public-by-design (only public marketing assets). `products/[slug]/images.js` discovers images
2–7 by HEAD-probing the CDN (image 1 is assumed to exist).

## SEO setup

- `app.vue` sets a global `titleTemplate` appending `· JUOKSUT` — **don't add it manually** in page
  titles. Homepage overrides with `titleTemplate: null` (plain `JUOKSUT`).
- `ogTitle` is separate from `title` and **should** include `· JUOKSUT` explicitly.
- Canonical `siteUrl` is `https://juoksut.run` (root, no www — Cloudflare redirects www → root).
- Default social image: `https://cdn.juoksut.run/og-image.jpg` (1200×630).
- Product pages emit JSON-LD Product schema (`shop/[...slug].vue`).
- **Sitemap is the static, hand-maintained `public/sitemap.xml`** (lists `/`, `/shop`, `/join`,
  `/fastlane-friday`, `/archive`). The `@nuxtjs/sitemap` module was removed (git history); update
  the file by hand when routes change.
- `public/robots.txt` and `public/sitemap.xml` are static, hand-maintained files. The sitemap and
  robots Nuxt modules are not installed.
- `site.webmanifest` has empty `name`/`short_name` (PWA branding gap). `CNAME` (`juoksut.run`) is a
  legacy GitHub-Pages artifact and unused on Cloudflare Pages.

## Instagram API

Archive + homepage hero pull from the JUOKSUT IG account via the Instagram Graph API (Instagram
Login product — no Facebook Page).

- **Token setup (one-time):** create a Meta app → Instagram Login for Business → generate a
  long-lived user token (`instagram_basic` + `user_media`) → store in D1:
  `wrangler d1 execute --remote juoksut-products --command "INSERT OR REPLACE INTO instagram_token (id, token, expires_at) VALUES (1, '<token>', '<ISO-date>')"`.
- **Auto-refresh:** `instagram.js` checks expiry on every cache-miss; within 7 days it calls
  `graph.instagram.com/refresh_access_token` and updates D1. The token is stored in D1 as plaintext
  and passed as a URL query param to the Graph API (server-side only; never sent to the client).
- **Caching:** all videos fetched and stored as one JSON blob in `instagram_cache` (id=1), 30-min
  TTL. Pagination is in-memory by `offset` (`PAGE_SIZE = 12`). Cache-miss has no request coalescing
  (thundering-herd possible) and paginates the IG API unbounded.

## Secrets and config

- `wrangler.toml` is committed — **D1 binding config only** (db name/id), no secrets.
- `.dev.vars` and `.env*` are gitignored; no secret value is in git history or the client bundle
  (verified). `runtimeConfig.public` exposes only non-secret values (siteUrl, siteName, siteImage).
- **No security response headers** (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  HSTS) are set anywhere, and there is **no rate limiting** on any endpoint.

## Conventions

- **Linting:** `@antfu/eslint-config` (`eslint.config.mjs`), stylistic on; `eqeqeq: error`,
  `vue/block-order` = `[script, template], style`. `useHead`/`useSeoMeta`/`$fetch`/`createError`
  etc. are Nuxt/Nitro **auto-imports** — eslint "undefined" warnings on them are false positives.
  Run `corepack yarn lint:fix` before committing.
- **Tailwind is pinned to v3** (`resolutions: { tailwindcss: "3.4.17" }`) — originally a workaround
  for `@nuxtjs/sitemap` pulling v4. The sitemap module is gone but the pin remains intentionally
  (v4 is a breaking upgrade). Theme: `pink = #FF639A`, serif = "JUOKSUT Garamond".
- **Global CSS** (`assets/css/tailwind.css`) defines fonts, `--nav-height: min(26.6vw, 6em)`,
  `body { overflow: hidden }` (the app relies on inner scroll containers), and a global
  `cursor: crosshair`.
- **Price** is cents in D1, euros in the UI (converted in `transformProductData`).

## Known issues / gotchas (see `docs/` for the full audit)

- Stock is checked when a Checkout Session is created but not reserved. Concurrent checkout sessions
  can therefore oversell a low-stock item before the successful-payment webhook decrements it.
- Product-specific checkout fields are limited by Stripe to three per session, including the optional
  order note. The current checkout reserves one slot for the note.
- `cancel.vue` does not clear the cart.

## Branch workflow

Cloudflare Pages auto-builds previews for non-main branches.

```bash
git checkout -b feat/my-change
git push -u origin feat/my-change      # check preview at *.juoksut.pages.dev, then:
git checkout main && git merge feat/my-change && git push
```
