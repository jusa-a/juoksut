# CLAUDE.md

Project-specific context for Claude Code. See `README.md` for end-user setup and
`docs/` for the deep audit (`architecture.md`, `security-review.md`, `roadmap.md`).

## What this project is

JUOKSUT Run Club website + shop (Helsinki). A Nuxt 3 (Vue 3 + Nitro) SSR app deployed on
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

Node **20** (`.nvmrc`). Package manager is **Yarn 4** via Corepack. In a non-interactive shell
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
d1/             → schema.sql + seed.sql  (GITIGNORED — not committed; see ".gitignore")
public/         → static assets, favicons, sitemap.xml, site.webmanifest
app.vue         → root: LoadingScreen + NuxtLayout + global SEO/title template
error.vue       → error page (statusCode/statusMessage + "go home")
```

> **`d1/` is gitignored** (last line of `.gitignore`). `schema.sql` and `seed.sql` exist locally but
> are **not** in version control — keep that in mind before assuming they're a shared source of truth.

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
| `/orders`               | `orders.vue`               | Order policy, preorder info, trip T&C. `robots: noindex`                                                                                                                                                                                                                                                                                             |
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

Defined in `d1/schema.sql` (gitignored). Four tables:

- **products** — `id, slug (UNIQUE), title, material (JSON), sizing (JSON), size_chart (JSON),
description, price (INTEGER cents), stripe_product_id, stripe_price_id`. The two `stripe_*`
  columns are **optional**; most products leave them NULL.
- **stock** — `id, product_slug (FK→products.slug ON DELETE CASCADE), size, quantity`. **Negative
  quantity = preorder/"coming soon"** (intentional; there is no `CHECK`/floor on quantity). There is
  **no index** on `product_slug`.
- **instagram_token** — single row (`id=1`): `token, expires_at, updated_at`. Long-lived IG token;
  auto-refreshed when within 7 days of expiry.
- **instagram_cache** — single row (`id=1`): `videos (JSON blob), cached_at`. 30-min TTL.

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
> `wrangler d1 execute`. The signed Stripe webhook is the only programmatic stock mutator.

## Critical: D1 access during SSR

**Never use `$fetch('/api/...')` in the Pinia store during SSR for D1 data.** Nitro's internal fetch
creates a fresh sub-request event that does **not** inherit `event.context.cloudflare`, so `D1` is
`undefined` in the API handler.

Fix (in `stores/products.js`): detect `import.meta.server`, grab `useRequestEvent()`, read
`event.context.cloudflare.env.D1`, and call the DB utilities directly — skip `$fetch`. Client-side
navigation uses `$fetch`/`useFetch` to the real API routes normally.

> **Verified (2026-06):** `pages/archive.vue` calls `useFetch('/api/instagram')` at **setup** (during
> SSR) and it **works** — the binding _is_ available to the internal `useFetch` sub-request in the
> current runtime, so the SSR HTML embeds the video payload and the client reuses it. (Confirmed
> against `wrangler pages dev` + the live site.) Implication: the store bypass above may be
> historical (it was added when internal `$fetch` _did_ lose D1, commit `bfe332e`) — treat the
> "loses D1" rule as version-dependent, not absolute. `pages/index.vue` still fetches in `onMounted`
> for its own reasons (random hero pick, client-only). See `docs/architecture.md §11`.

## API routes (`server/api/`)

| Route                             | File                        | Notes                                                                                          |
| --------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /api/products`               | `products.js`               | All products with stock                                                                        |
| `GET /api/products/[slug]`        | `products/[slug].js`        | Single product. **Bug:** its own 404 is caught and re-thrown as 500                            |
| `GET /api/products/[slug]/images` | `products/[slug]/images.js` | Probes CDN (HEAD) for images 2–7. No D1. Imports `node-fetch` (an _undeclared_ transitive dep) |
| `POST /api/checkout`              | `checkout.js`               | Validates stock + re-reads price from D1, creates Stripe session (30-min expiry)               |
| `GET /api/order-details`          | `order-details.js`          | Fetches Stripe session by `session_id` (returns `customer_details` PII)                        |
| `POST /api/stripe-webhook`        | `stripe-webhook.js`         | Verifies signature, batch-updates D1 stock on `checkout.session.completed`                     |
| `GET /api/instagram`              | `instagram.js`              | Paginated videos from D1 cache (`?offset=N`); refreshes token + repopulates cache on miss      |

## Stripe flow

Cart (Pinia → localStorage) → `Cart.vue` `useFetch('POST /api/checkout', { items })` →
server validates stock + **re-reads price from D1** (never trusts client price) → Stripe hosted
checkout → `window.location.href = session.url` → `/success?session_id=…` → Stripe fires
`checkout.session.completed` → webhook decrements D1 stock.

**Two pricing paths in `checkout.js`:**

1. **Inline `price_data`** (most products, `stripe_price_id` NULL): server sets
   `product_data.metadata = { slug, size }` so the webhook can map the line item back to D1 stock.
2. **Pre-created `stripe_price_id`** (only `all-stars-camp`, `runway-riga` — event/trip
   registrations): the line item is just `{ price, quantity }` with **no metadata added by
   checkout**. The webhook's slug/size lookup therefore depends entirely on metadata set
   **Stripe-side** on the Product/Price; size falls back to `'ONE-SIZE'`. If `slug` metadata is
   missing in Stripe, the webhook throws and the whole stock batch fails. (See security review.)

**Webhook gotchas** (`stripe-webhook.js`):

- Signature **is** verified (`constructEventAsync` over the raw body) — good.
- The entire handler is wrapped in `if (endpointSecret)` with no `else`: if
  `STRIPE_WEBHOOK_SECRET` is unset, it silently returns 200 and **never decrements stock**.
- **Not idempotent** — a retried/duplicate `checkout.session.completed` decrements stock again.
- Decrement has no floor (`quantity = quantity - ?`), so stock can over-decrement / go negative.
- Code comment says "20 min" session expiry but the value is **30 min** (`60 * 30`).

## Event registration / ticketing (third-party — not first-party)

- **Fastlane Friday** (`fastlane-friday.vue`): Ticket Tailor widget script
  (`cdn.tickettailor.com/js/widgets/min/widget.js`) injected on "Sign Up" click; 5s fallback link.
- **nb-order-form** (`nb-order-form.vue`): Tally form iframe (`tally.so/embed/…`).
- **live-love-lightspeed** (legacy): posts to a Google Form via a hidden iframe.
- Trip registrations (`all-stars-camp`, `runway-riga`) DO go through first-party Stripe Checkout
  (size/distance collected via the checkout custom "Order note" field).

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
- **There is no `robots.txt`** anywhere (gap). `README.md`'s claims about `@nuxtjs/sitemap` /
  `@nuxtjs/robots` are **stale/inaccurate** — neither module is installed.
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

- Webhook: no idempotency; silent no-op if `STRIPE_WEBHOOK_SECRET` unset; pre-created-price products
  rely on Stripe-side `slug` metadata.
- `products/[slug].js` turns its own 404 into a 500.
- `images.js` imports `node-fetch`, which is undeclared in `package.json` (works only as a hoisted
  transitive dep) — global `fetch` is available under `nodeCompat`.
- Checkout does not validate `body.items`/`quantity` shape (negative quantity slips past the stock
  check; Stripe then rejects it).
- ~~`archive.vue` SSR Instagram fetch~~ — verified working (D1 _is_ available to SSR `useFetch`); see
  the "D1 access during SSR" caveat above.
- `cancel.vue` does not clear the cart.

## Branch workflow

Cloudflare Pages auto-builds previews for non-main branches.

```bash
git checkout -b feat/my-change
git push -u origin feat/my-change      # check preview at *.juoksut.pages.dev, then:
git checkout main && git merge feat/my-change && git push
```
