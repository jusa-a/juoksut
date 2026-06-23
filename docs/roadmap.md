# JUOKSUT — Roadmap

> Prioritized, honest backlog from the audit (`docs/architecture.md`, `docs/security-review.md`).
> Priorities: **P1 = now** (correctness/security that actually bites), **P2 = next**, **P3 = later**.
> Effort: **S** ≈ <1h, **M** ≈ a few hours, **L** ≈ a day+. Nothing here is auto-applied except the
> handful marked **[Stage 5]** (clearly-safe wins applied on the `audit-clean` branch); everything
> else is left for a deliberate decision. Security IDs (H/M/L#) map to `docs/security-review.md`.

## Priority backlog (at a glance)

| ID  | P   | Category     | Item                                                                      | Where                               | Effort |
| --- | --- | ------------ | ------------------------------------------------------------------------- | ----------------------------------- | ------ |
| R1  | P1  | Bug/Security | Webhook idempotency (dedup events)                                        | `stripe-webhook.js:34-57`           | M      |
| R2  | P1  | Bug/Security | Pre-created-price line-item metadata                                      | `checkout.js:37-43`                 | S–M    |
| R3  | P1  | Bug/Security | Webhook fail-loud if secret unset                                         | `stripe-webhook.js:15-71`           | S      |
| R4  | P1  | Bug          | API 404 swallowed as 500                                                  | `products/[slug].js:11-17`          | S      |
| R5  | P3  | Tech-debt    | ~~archive SSR fetch~~ RESOLVED (works); re-test products-store SSR bypass | `stores/products.js`                | S      |
| R6  | P1  | Tech-debt    | Remove `node-fetch` phantom import **[Stage 5]**                          | `images.js:2`                       | S      |
| R7  | P1  | Tech-debt    | Version-control the D1 schema (un-gitignore)                              | `.gitignore`, `d1/`                 | S      |
| R8  | P2  | Security     | Rate limiting + cap `body.items`                                          | `checkout.js`, others               | M      |
| R9  | P2  | Security     | Stock TOCTOU / oversell guard                                             | `checkout.js:28-35` + webhook       | L      |
| R10 | P2  | Security     | Narrow `order-details` PII + `payment_status`                             | `order-details.js:20-30`            | S      |
| R11 | P2  | Security     | Security headers via `_headers`                                           | new `public/_headers`               | S      |
| R12 | P2  | Bug/Security | Validate checkout body/quantity                                           | `checkout.js:11-62`                 | S      |
| R13 | P2  | Security     | Generic client error messages                                             | `checkout.js:94-97`, `instagram.js` | S      |
| R14 | P2  | Deps         | Bump nuxt / @nuxt/devtools / wrangler                                     | `package.json`                      | S–M    |
| R15 | P2  | Tech-debt    | Index + UNIQUE on `stock(product_slug,size)`                              | `d1/schema.sql:38-44`               | S      |
| R16 | P2  | Security     | Escape `</script>` in JSON-LD                                             | `shop/[...slug].vue:248-268`        | S      |
| R17 | P2  | SEO          | Add `robots.txt`; fix webmanifest name; sitemap upkeep                    | `public/`                           | S      |
| R18 | P2  | Tests        | First tests on the money path                                             | new                                 | M      |
| R19 | P3  | Security     | Sanitize / accept-risk `v-html` description                               | `shop/[...slug].vue:71`             | S–M    |
| R20 | P3  | Resilience   | Instagram cache stampede / SWR                                            | `instagram.js:71-80`                | M      |
| R21 | P3  | Security     | IG token: log message only; header auth                                   | `instagram.js:19,31,45`             | S      |
| R22 | P3  | Perf         | Parallelize image HEAD probes **[Stage 5 w/ R6]**                         | `images.js:14-25`                   | S      |
| R23 | P3  | Data         | Stock floor / negative reconcile; filter phantom row                      | `productUtils.js`, webhook          | M      |
| R24 | P3  | Tech-debt    | Unify description line-breaks (`\n` vs `<br>`)                            | `productUtils.js:43`                | S      |
| R25 | P3  | UX           | `cancel.vue` should clear the cart                                        | `cancel.vue`                        | S      |
| R26 | P3  | Cleanup      | Dead code/config sweep **[Stage 5: lint-safe parts]**                     | various                             | S      |

---

## P1 — now

### R1 · Webhook idempotency _(Bug/Security — H1)_

**`server/api/stripe-webhook.js:34-57`** · Effort M.
Stripe redelivers `checkout.session.completed`; the blind `quantity = quantity - ?` decrement runs
again each time. **Why:** inventory silently drifts on routine retries — the one job D1 has.
**Approach:** a `processed_events(id TEXT PRIMARY KEY, created_at)` table; `INSERT OR IGNORE` the
`stripeEvent.id` and skip if it already existed, before applying the batch. _(Left for you — schema +
logic change on the money path; verify against a Stripe redelivery.)_

### R2 · Pre-created-price line-item metadata _(Bug/Security — H2)_

**`server/api/checkout.js:37-43`** · Effort S–M.
The `stripe_price_id` branch sends no `slug`/`size` metadata, so the webhook depends on Stripe-side
metadata that may not exist (affects `all-stars-camp`, `runway-riga`). **Why:** their stock may never
decrement and the webhook may 500 on every retry. **Approach:** (1) add `metadata: { slug, size }`
to the line item in that branch (mirrors the inline path), **and** (2) verify in the Stripe dashboard
whether `prod_T43A…`/`prod_TkAv…` already carry `slug` metadata. _(Left for you — touches money path;
also needs a dashboard check.)_

### R3 · Webhook fail-loud when secret is unset _(Bug/Security — M1)_

**`server/api/stripe-webhook.js:15-71`** · Effort S.
Add an `else { throw createError({ statusCode: 500 }) }` so a missing `STRIPE_WEBHOOK_SECRET` surfaces
instead of silently returning 200 and skipping all stock updates. **Why:** turns a silent
fail-open into a loud, debuggable failure. _(Left for you — one-line behavior change on the webhook,
worth a conscious decision + a redeploy check.)_

### R4 · API 404 swallowed as 500 _(Bug — L3)_

**`server/api/products/[slug].js:11-17`** · Effort S.
Re-throw when `error.statusCode` is set (or move the not-found check outside the `try`). **Why:**
correct status for crawlers/clients. _(Left for you — trivial, but it's a behavior change on a public
route; safe to apply anytime.)_

### R5 · ~~`archive.vue` SSR fetch~~ → RESOLVED; re-test the products-store SSR bypass _(Tech-debt)_

**`stores/products.js:29-39, 72-82`** · Effort S.
**Originally flagged as a likely bug; verified working instead.** The archive's SSR
`useFetch('/api/instagram')` **does** get the D1 binding and renders correctly — confirmed against
`wrangler pages dev` (the SSR HTML embeds the full 12-video payload) and by the maintainer on live
`juoksut.run` (see `docs/architecture.md §11`). No fix needed. **What remains (optional):** since
internal fetch evidently retains D1 in the current runtime, the products-store SSR bypass (added when
it _didn't_, commit `bfe332e`) may be dead complexity. To confirm, temporarily remove the bypass and
check `/shop` still SSRs products; if so, simplify the store. Low value, harmless as-is.

### R6 · Remove `node-fetch` phantom import _(Tech-debt — L8)_ **[Stage 5]**

**`server/api/products/[slug]/images.js:2`** · Effort S.
Replace `import fetch from 'node-fetch'` with the global `fetch` (available under `nodeCompat`).
**Why:** removes a latent build break (undeclared dependency) at zero behavior cost. _(Applied in
Stage 5 — provably safe; build/lint verified.)_

### R7 · Version-control the D1 schema _(Tech-debt — "pick it back up")_

**`.gitignore` (last line `d1`), `d1/schema.sql`** · Effort S.
`d1/` is gitignored, so the canonical table definitions live only on one machine. **Why:** the single
biggest risk to "confidently picking this back up" — lose the laptop, lose the schema. **Approach:**
un-gitignore and commit `d1/schema.sql` (it contains no secrets). `d1/seed.sql` contains product copy
and **non-secret** Stripe product/price IDs — committing it is fine and gives a reproducible local DB,
but that's your call. _(Left for you — it's a policy decision about what belongs in git; flagged
because it materially affects recoverability.)_

## P2 — next

### R8 · Rate limiting + item cap _(Security — M2)_

`server/api/checkout.js` (+ `order-details.js`, `instagram.js`, `images.js`) · Effort M.
Anonymous clients can spam billable Stripe session creation and amplify IG/CDN calls. Add Cloudflare
WAF rate-limit rules and/or Turnstile on `/api/checkout`, and cap `body.items` length.

### R9 · Stock oversell / TOCTOU _(Security/Bug — M3)_

`server/api/checkout.js:28-35` + webhook · Effort L.
Stock is checked at session creation but decremented up to 30 min later with no hold. Add a
reservation-with-expiry, or a conditional decrement (`AND quantity >= ?`) plus reconciliation. Lowest
priority of the webhook cluster (needs concurrent last-unit completions to trigger).

### R10 · Narrow `order-details` PII _(Security — L1)_

`server/api/order-details.js:20-30` · Effort S.
Verify `payment_status === 'paid'` and return only what `success.vue` renders (drop full
address/phone). Pairs with R8 for rate limiting.

### R11 · Security headers _(Security — L2)_

new `public/_headers` · Effort S.
Add `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, and a CSP
allowing `cdn.juoksut.run`, Stripe, Ticket Tailor, Tally. Defense-in-depth (esp. with R16/R19).

### R12 · Validate checkout body/quantity _(Bug/Security — L4)_

`server/api/checkout.js:11-62` · Effort S.
Reject non-array/empty/oversized `items` with 400; coerce `quantity` to int ≥ 1, `slug`/`size` to
strings.

### R13 · Generic client error messages _(Security — L5)_

`server/api/checkout.js:94-97`, `instagram.js:11,49,60` · Effort S.
Mirror the correct pattern already in `order-details.js:32-35` (log server-side, return generic text).

### R14 · Dependency bumps _(Deps — L12)_

`package.json` · Effort S–M (test build after).
Bump `nuxt` to a patched 3.x, `@nuxt/devtools` ≥ 2.6.4, `wrangler` ≥ 4.59.1. Runtime exposure of the
nuxt advisories is low (`navigateTo` unused, no `.server.vue`), but stay current. **Note:** the
Tailwind v3 `resolutions` pin (`package.json:41-43`) should stay — v4 is a separate, breaking change.

### R15 · Stock index + UNIQUE _(Tech-debt/Perf — L9)_

`d1/schema.sql:38-44` · Effort S.
`CREATE UNIQUE INDEX ON stock(product_slug, size)` — speeds the join/UPDATE and prevents duplicate
rows. Apply via `wrangler d1 execute --remote --command` (don't run the full schema file remotely).

### R16 · Escape `</script>` in JSON-LD _(Security — L7)_

`pages/shop/[...slug].vue:248-268` · Effort S.
Escape `<` → `<` in the serialized JSON before injecting via `innerHTML`.

### R17 · SEO gaps _(SEO)_

`public/` · Effort S.
Add a `robots.txt` (currently missing entirely); set `name`/`short_name` in `site.webmanifest`
(currently empty); keep `public/sitemap.xml` in sync when routes change (it's hand-maintained). Update
`README.md`, which still claims `@nuxtjs/sitemap`/`@nuxtjs/robots` (removed).

### R18 · First tests on the money path _(Tests)_

new · Effort M.
There are **no tests** in the repo. The highest-value first tests: checkout price authority (client
price ignored, D1 price used), and webhook idempotency (after R1). Even a couple guards regressions on
the parts that move money/inventory.

## P3 — later

- **R19 · `v-html` description** _(L6)_ — sanitize with an allowlist or document it as trusted admin
  input. `shop/[...slug].vue:71`. S–M.
- **R20 · Instagram cache stampede** _(L11)_ — refresh lock / `event.waitUntil` stale-while-revalidate;
  cap pagination. `instagram.js:71-80,38-55`. M.
- **R21 · IG token hygiene** _(L10)_ — log `err.message` only; pass token via header if supported.
  `instagram.js:19,31,45`. S.
- **R22 · Parallelize image probes** _(L13)_ — `Promise.all` the HEADs. `images.js:14-25`. S.
  **[Stage 5, bundled with R6.]**
- **R23 · Stock floor / phantom row** _(L9)_ — conditional decrement + filter `size:null` rows in the
  query/transform. `productUtils.js:8-25`, webhook. M.
- **R24 · Description convention** — pick one of `\n` / `<br>` and migrate seed data.
  `productUtils.js:43`. S.
- **R25 · `cancel.vue` clear cart** _(UX)_ — call `cart.clearCart()` or leave intentionally
  (cancel ≠ empty cart is arguably correct). S.
- **R26 · Dead code/config sweep** — remove unused `BASE_URL` (`.dev.vars`), verify+remove legacy
  `CNAME`, delete commented `onSubmit` block in `live-love-lightspeed.vue:134-167`, consider archiving
  the legacy event page. **[Stage 5 applies only the lint-safe, provably-dead parts.]** S.

---

## "Could do X" — bigger moves, with trade-offs (don't apply lightly)

- **Persist orders in D1.** Today orders/PII live only in Stripe (clean, low-liability). Storing them
  would enable an order-history/admin view but adds a PII store → GDPR scope, encryption, retention.
  **Recommendation:** keep Stripe as system of record unless a concrete need appears.
- **Admin UI for stock/products.** Replaces the `wrangler d1 execute` workflow with convenience — but
  introduces the first authenticated, mutating, attack-surfaced endpoints in the app.
  **Trade-off:** ergonomics vs. a whole new security boundary. Only if editing becomes frequent.
- **Proper stock reservation system.** Fully fixes R9 (holds with expiry, atomic claims) at the cost
  of real complexity. Justified only if drops routinely oversell.
- **Re-adopt `@nuxtjs/sitemap`.** Auto-generates the sitemap (no manual upkeep, R17) but previously
  pulled Tailwind v4 and was removed. Would need to be reconciled with the v3 pin.
- **Tailwind v4 upgrade.** Future-proofing; a breaking migration. Low urgency given the v3 pin works.
- **CI checks.** A GitHub Action running `lint` + `build` (+ R18 tests) on PRs would catch the
  phantom-dep/build-break class automatically. Low effort, high leverage for a solo maintainer.

## Suggested order

R6 + R22 (Stage 5, done) → R4, R3, R2 (quick correctness on the money path) → R1 (idempotency) →
R7 (commit schema) → then the P2 security/SEO batch (R8–R17) → R18 tests → P3 polish (incl. R5).
_(R5 was verified working during the audit and demoted to P3 — no longer a blocker.)_
