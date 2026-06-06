# JUOKSUT — Security Review

> Read-only security review of the whole repo. Findings come from a multi-agent independent sweep
> (6 lenses: Stripe/payments, D1/SQLi, secrets/config/headers, auth/abuse, input/XSS, Instagram/deps)
> followed by adversarial verification — each finding was re-checked against the actual code and
> re-rated, and two were dropped as non-issues. Severities are **calibrated for this specific stack**:
> there is no user-account/auth system, product/stock data is admin-controlled (edited via
> `wrangler`, no public write path), Stripe is the system of record for payments/orders/PII, and the
> app runs behind Cloudflare's edge. Nothing here is fixed — fixes are scheduled in `docs/roadmap.md`.

## TL;DR

- **No Critical findings.** No SQL injection (all queries parameterized), no secret leakage (secrets
  are server-only, gitignored, absent from git history and the client bundle), no SSRF (outbound
  hosts are hardcoded), and no unauthenticated stock-write endpoint (the signed webhook is the only
  programmatic mutator).
- The real risk cluster is **inventory/stock integrity in the Stripe webhook path** — three issues
  that can silently desync D1 stock from reality. None lose money (Stripe is the source of record),
  but they undermine the one thing D1 is for.
- Everything else is Low/Info, mostly defense-in-depth or hygiene, appropriately bounded by the
  no-auth/admin-data nature of the app.

| Severity | Count | Items |
|---|---|---|
| Critical | 0 | — |
| High | 2 | Webhook not idempotent; pre-created-price metadata gap |
| Medium | 3 | Webhook silent no-op if secret unset; no rate limiting; checkout→webhook stock TOCTOU |
| Low | ~13 | PII via session_id, no security headers, 404→500, input validation, info leakage, v-html/JSON-LD XSS, node-fetch phantom dep, stock index/floor/phantom-row, IG token handling, dependency advisories |
| Info | ~5 | BASE_URL dead config, worker sourcemaps, verbose server logging, opaque-500 on missing D1, cancel.vue cart |

---

## High

### H1 — Stripe webhook is not idempotent; duplicate/retried events double-decrement stock
**`server/api/stripe-webhook.js:34-57`** · Payments/Data integrity

Stripe delivers `checkout.session.completed` **at least once** and retries on any non-2xx or
timeout. The handler builds one blind relative decrement per line item —
`UPDATE stock SET quantity = quantity - ? WHERE product_slug = ? AND size = ?` (`:51-53`) — and runs
them via `D1.batch` (`:57`) with **no dedup** on `stripeEvent.id` or `session.id` (grep for
`processed|idempoten|event.id|INSERT OR IGNORE` finds nothing; `d1/schema.sql` has no such table).
A redelivery therefore decrements the same order's stock again.

**Impact (bounded):** inventory miscount only — no money lost, no order/customer data corrupted
(Stripe holds those). But this is the most *likely-to-actually-happen* bug here, since retries are
routine. **Fix:** record processed event/session ids (a `processed_events(id PRIMARY KEY)` table with
`INSERT OR IGNORE`, skip if already present) before applying the batch, inside the same logical step.

### H2 — Pre-created Stripe Price line items carry no slug/size metadata; the webhook can throw and fail the whole stock batch
**`server/api/checkout.js:37-43`** (+ `server/api/stripe-webhook.js:35-49`) · Payments/Data integrity

When `product.stripe_price_id` is set, checkout pushes only `{ price, quantity }` with **no
metadata** (`:37-43`) — unlike the inline-price path, which attaches
`product_data.metadata = { slug, size }` (`:53-56`). The webhook recovers slug from
`item.price.product?.metadata.slug || item.price.metadata.slug` and **throws "Missing slug metadata"
if absent** (`stripe-webhook.js:47-49`). Because that throw happens while building the batch, it
fails the **entire** order's stock update, not just one line. Size is safe (falls back to
`'ONE-SIZE'`, `:42-43`).

The only two pre-created-price products are **`all-stars-camp`** (€199) and **`runway-riga`** (€50
deposit) — event/trip registrations whose size/distance is collected via the checkout note field.

**Open question / verify in Stripe:** whether slug metadata exists on `prod_T43A…`/`prod_TkAv…` (or
their prices) cannot be seen from the repo. If it's missing, these two registrations never decrement
stock and the webhook 500s on every retry. **Fix:** either set `slug` (and `size`) metadata on those
Stripe Products/Prices, **or** (more robust) attach `metadata: { slug, size }` to the line item in
the `stripe_price_id` branch too, so the webhook never depends on dashboard state.

---

## Medium

### M1 — Webhook silently no-ops (returns 200) when `STRIPE_WEBHOOK_SECRET` is unset
**`server/api/stripe-webhook.js:15-71`** · Payments/Config safety

The entire handler body — signature verification (`:18`), event handling, and the stock `D1.batch`
(`:57`) — is wrapped in `if (endpointSecret) { … }` with **no `else`** (`:15`→`:71`). If the secret
is missing/misnamed in an environment, execution falls off the end and returns `undefined` → HTTP
200, so **Stripe believes delivery succeeded while stock is never decremented** and signature is
never checked. Not attacker-triggerable (requires operator misconfiguration), but a silent
fail-open for a critical path. **Fix:** if `endpointSecret` is falsy, `throw createError({ statusCode: 500 })`
(fail loud) so misconfiguration surfaces immediately.

### M2 — No rate limiting on any endpoint (checkout can spam live Stripe session creation)
**`server/api/checkout.js:6-90`** (also `order-details.js`, `instagram.js`, `products/[slug]/images.js`) · Abuse/DoS

There is no auth, no `server/middleware/`, and no rate-limit/Turnstile anywhere (grep confirms; the
only `throttle` is `app.vue:29`, a UI loading-indicator config). An anonymous client can: spam
`POST /api/checkout` → billable `stripe.checkout.sessions.create` calls (`:65`) + N D1 reads per
request (`body.items` has no length cap, `:20-21`); trigger Instagram API fan-out on cache miss; and
amplify HEAD requests to the CDN. Cloudflare absorbs volumetric L3/L4 abuse, but application-level
spam (Stripe rate-limit pressure during a drop, IG quota burn) is unmitigated. **Fix:** add a
lightweight throttle on the abusable endpoints — Cloudflare WAF rate-limit rules and/or Turnstile on
`/api/checkout`, and cap `body.items` length.

### M3 — Checkout-time stock check and webhook decrement form a TOCTOU window (overselling)
**`server/api/checkout.js:28-35`** + **`server/api/stripe-webhook.js:51-53`** · Business logic/Concurrency

Stock is *read-checked* at session creation (`checkout.js:30`, a pure read via `fetchProductData`)
but only *decremented* up to 30 minutes later by the webhook, with **no reservation/hold and no
`AND quantity >= ?` guard** on the UPDATE. Two buyers can both pass the check for the last unit and
both complete payment; D1 stock goes negative (and negative also means "preorder", so the oversell is
invisible). Low exploitability (needs concurrent completions of the same last unit), realistic only
on a hyped low-stock drop. **Fix:** reserve/decrement at checkout with an expiry-based release, or
add a conditional decrement and reconcile against Stripe; at minimum, document the oversell window.

---

## Low

### L1 — `order-details` returns full customer PII to any holder of a `session_id`
**`server/api/order-details.js:4-31`** · PII/Access control

The endpoint is unauthenticated; the only guard is a presence check on `session_id` (`:8-10`). It
returns `session.customer_details` verbatim — name, email, phone, billing address (`:24`). The
`session_id` is a high-entropy Stripe `cs_…` token (not enumerable), but it sits in the
`/success?session_id=…` URL (`success.vue:49`) and can leak via referrer/history/shared links. To its
credit the response is otherwise narrowed to `description/quantity/amount_total` per line item
(`:25-29`). **Fix:** verify `payment_status === 'paid'`, drop fields the success page doesn't render
(phone/full address), and add rate limiting to blunt validation/abuse.

### L2 — No security response headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS)
**`nuxt.config.ts:22-32`** (none set anywhere) · Headers/Defense-in-depth

No headers are set in `routeRules`, a `_headers` file, or middleware. Real impact is low (no
auth/cookies to protect; checkout redirects to Stripe's own page), but a CSP would be meaningful
defense-in-depth against the XSS vectors below, and `X-Content-Type-Options`/`Referrer-Policy` are
free wins. **Fix:** add a Cloudflare Pages `_headers` file (or Nitro `routeRules` headers) with
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: SAMEORIGIN`, and a CSP (allow `cdn.juoksut.run`, Stripe, Ticket Tailor, Tally).

### L3 — Single-product API 404 is swallowed and re-thrown as 500
**`server/api/products/[slug].js:11-17`** · Correctness/SEO

`throw createError({ statusCode: 404 })` is inside the `try` and caught by the same block, which
re-throws a generic 500 (`:17`). Crawlers/clients hitting a missing product via the API get 500
instead of 404. (The *page* `shop/[...slug].vue:184-189` 404s correctly because the store bypasses
this route during SSR.) **Fix:** re-throw when `error.statusCode` is already set, or move the
not-found check outside the `try`.

### L4 — Checkout does not validate request body shape, quantity sign/type
**`server/api/checkout.js:11-62`** · Input validation

`body.items` is iterated with no array/length check (`:20`); a malformed body throws a TypeError
returned as a sloppy 500 (not 400). `item.quantity` is never validated positive, so a negative
quantity passes the stock gate (`0 < -5` is false, `:30`). Price is re-read from D1 so charging is
safe, and Stripe rejects bad quantities downstream — so impact is forced errors, not bad orders.
**Fix:** validate `items` is a non-empty bounded array and coerce `quantity` to an integer ≥ 1,
`slug`/`size` to strings, returning 400 on violation.

### L5 — API error responses propagate internal `error.message` to clients
**`server/api/checkout.js:94-97`** (also `instagram.js:11,49,60`) · Information leakage

`checkout.js` re-wraps any caught error into `createError({ message: error.message })`, surfacing
Stripe/D1 internal text to the client (and to the cart UI via `Cart.vue:121`). `instagram.js:49`
forwards Instagram's upstream error verbatim. No secrets leak (Stripe error objects don't carry the
API key), but it's needless internal exposure. `order-details.js:32-35` does this **correctly**
(logs server-side, returns a fixed generic message) — mirror that pattern. **Fix:** return generic
client messages; log details server-side only.

### L6 — `v-html` renders DB-derived `product.description` as raw HTML
**`pages/shop/[...slug].vue:71`** · XSS (admin-controlled data)

`v-html="product.description"` with no sanitization (`productUtils.js:43` only wraps paragraphs).
The only write path is admin-controlled D1, so this is near-theoretical today, but it would become
stored XSS the moment descriptions accept any untrusted input. **Fix:** restrict to a known tag
allowlist / sanitize, or treat as accepted-risk and document that descriptions are trusted input.

### L7 — JSON-LD injected via `innerHTML` without escaping `</script>`
**`pages/shop/[...slug].vue:248-268`** · XSS (admin-controlled data)

`JSON.stringify(product.title / rawDescription …)` is placed into a
`<script type="application/ld+json">` via `innerHTML`. `JSON.stringify` does not escape `<` or `/`,
so a product string containing `</script>` would break out of the tag. Admin-data only → low. **Fix:**
escape `<` as `<` in the serialized JSON before injecting.

### L8 — `node-fetch` imported in a production route but is an undeclared (phantom) dependency
**`server/api/products/[slug]/images.js:2`** · Dependency/Reliability

`import fetch from 'node-fetch'` (`:2`), but `node-fetch` is not in `package.json`; `yarn.lock`
resolves it only transitively (via `@mapbox/node-pre-gyp` ← sharp/@nuxt/image ← nitropack). It works
today purely by hoisting and would break if the dependency tree shifts. The global `fetch` is
available under `nodeCompat`. **Fix:** delete the import and use the global `fetch` (also lets you
`Promise.all` the HEAD probes). Not a security issue — reliability/supply-chain hygiene.

### L9 — Stock table: no index, no floor, phantom null row
**`d1/schema.sql:38-44`** + **`server/utils/productUtils.js:8-25`** · Data integrity/Performance
- **No index** on `stock.product_slug` (or `(product_slug,size)`); the hot `LEFT JOIN` and webhook
  UPDATE scan. Trivial data volume today, but a `UNIQUE(product_slug,size)` index would also prevent
  duplicate rows. **Fix:** `CREATE INDEX`/`CREATE UNIQUE INDEX`.
- **No floor** on the decrement (`stripe-webhook.js:51-53`) → stock can go arbitrarily negative
  (entangled with the "negative = preorder" convention). **Fix:** add `AND quantity >= ?` or
  reconcile; don't add a blanket `CHECK (quantity >= 0)` (it would break preorders).
- **Phantom row:** products with zero stock rows yield `[{"size":null,"quantity":null}]`
  (`productUtils.js:8-25`; live: `fastlane-track-bag`). **Fix:** filter null sizes in the query/transform.

### L10 — Instagram token handling: plaintext in D1, passed in URL query, broad error logging
**`server/api/instagram.js:8-36, 44-46, 31`** · Secret handling/Info leakage

The token is stored plaintext (`schema.sql:51-56`), interpolated into outbound Graph API URLs
(`:19,45`), and the refresh-failure path logs the whole error object (`:31`). The token is never
returned to clients and is a low-privilege read-only scope (`instagram_basic`+`user_media`) on a
public feed, so exposure is minimal. **Fix:** log `err.message` only; pass the token via header if
the API allows; accept plaintext-at-rest as low risk for this scope.

### L11 — Instagram cache-miss thundering herd + unbounded pagination
**`server/api/instagram.js:71-80, 38-55`** · Resilience

On cache miss every concurrent request independently refreshes the token, paginates IG `/me/media`
(no page cap, `:42-52`), and writes the cache — no in-flight coalescing or stale-while-revalidate.
Availability/cost concern only. **Fix:** add a refresh lock/coalesce or `event.waitUntil`
stale-while-revalidate; cap pages.

### L12 — Dependency advisories (mostly dev-time or feature-not-used)
`package.json` · Supply chain. From `corepack yarn npm audit --all`:
- **wrangler 4.5.1** — OS command injection in `wrangler pages deploy` (GHSA, "high"). **Dev/deploy
  tooling only**, never on the edge → negligible runtime risk. Bump to ≥ 4.59.1.
- **nuxt 3.16.0** (≤3.21.5) — reflected XSS in `navigateTo()` external redirect, `__nuxt_island`
  cache poisoning, client-side path traversal, `.server.vue` island middleware bypass. **Real-world
  applicability is low here:** `navigateTo` is never called (grep = 0 matches) and there are no
  `.server.vue` pages. Still, bump nuxt to a patched 3.x.
- **@nuxt/devtools 2.2.1** — XSS (<2.6.4), dev-only. Bump.

### L13 — Image-probe route makes 6 sequential CDN HEADs with no slug validation/caching
**`server/api/products/[slug]/images.js:14-25`** · Perf/Abuse

`for (i=2..7) await fetch(url, {method:'HEAD'})` — serial round-trips against the project's own CDN,
for any unvalidated slug, uncached. Self-amplification only (1→6), cheap edge HEADs. **Fix:**
`Promise.all` the probes; optionally validate slug exists / add caching.

---

## Info / not findings

- **`BASE_URL` is dead config** (`.dev.vars`) — never read; redirect URLs use
  `getRequestURL(event).origin` (`checkout.js:14,68-69`). Remove or wire it in.
- **Worker source maps** (`dist/_worker.js/.../*.mjs.map`) are emitted for API routes, but no secret
  value is baked in and on Cloudflare Pages `_worker.js/` is the executor, not browsable. Effectively
  none.
- **Verbose server logging** — `console.error(error)` logs full error objects (`checkout.js:95`).
  Confirmed no secret/token is present in those objects.
- **Opaque 500 on missing D1 binding** — `checkout.js:17-21` has no null guard before
  `D1.prepare(...)`; a missing binding yields a generic 500. Robustness nit, not a vuln (dropped as
  non-finding in verification).
- **`instagram.js` `offset`** is `Number()`-coerced without NaN/negative validation (`:62-85`), but
  it only feeds `Array.slice` on public data — no injection, no exposure (dropped as non-finding).
- **`cancel.vue` does not clear the cart** — UX, not security.

---

## What's already done right

The security fundamentals for a shop are in place:

- **Server-side price authority.** Checkout re-reads price from D1 and never trusts the client cart's
  `price` (`checkout.js:21-49`; `stores/cart.js:30` is display-only). Client price tampering is
  impossible.
- **Webhook signature verification** done correctly for the edge runtime — `readRawBody` +
  `stripe.webhooks.constructEventAsync(rawBody, signature, secret)` before any DB write, only acting
  on `checkout.session.completed`, returning 400 on failure (`stripe-webhook.js:13,18,22,69`).
- **No SQL injection** — every D1 query is a parameterized `.prepare().bind()`; the only dynamic SQL
  fragment is a constant `WHERE p.slug = ?` (`productUtils.js:24,28`, `stripe-webhook.js:51-53`,
  `instagram.js:9,25-27,77-79`).
- **Secrets are clean.** `STRIPE_*` are read only via `process.env` in `server/api/*` — zero
  references in any `.vue`/client file; `runtimeConfig.public` exposes only non-secret values
  (`nuxt.config.ts:79-87`). `.env`/`.dev.vars` are gitignored, never in git history, and no secret
  value appears in the build bundle. `wrangler.toml` commits only D1 binding config.
- **No SSRF** — every outbound host is hardcoded (`graph.instagram.com`, `cdn.juoksut.run`); only
  trusted token + IG cursor are interpolated (`instagram.js:3,18,44`; `images.js:6,15`).
- **No unauthenticated mutation surface** — there is no admin/stock-write HTTP endpoint at all; stock
  is mutated only by the signed webhook (verified the only stock-writing SQL in the repo).
- **Output escaping** — `success.vue` renders buyer-entered Stripe fields via `{{ }}` (auto-escaped,
  `:5-19`); archive/index bind IG URLs via `:src`/`:href` with `rel="noopener"` on external links.
- **Sensible bounds** — 30-min checkout-session expiry (`checkout.js:89`), 30-min IG cache
  (`instagram.js:5,67`), atomic `D1.batch` for stock (`stripe-webhook.js:57`), narrowed
  `order-details` projection (`order-details.js:25-29`), column-scoped D1 reads.

## Methodology & limits

Findings were generated by 6 independent security-lens agents reading the actual code, merged with
the reviewer's own first-hand reading, then each adversarially re-verified against the cited lines
(48 confirmed, 2 dropped). **Not covered / can't be verified from the repo:** Stripe dashboard state
(see H2), Cloudflare Pages dashboard config (env vars, WAF, custom domains), R2 bucket ACLs, and
runtime behavior requiring a live D1 binding (see the archive SSR open question in
`docs/architecture.md §11`). `npm audit` was run against the resolved `yarn.lock`.
