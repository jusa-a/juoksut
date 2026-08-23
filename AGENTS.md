# JUOKSUT project guidance

Before starting substantive work, read `CLAUDE.md` for the detailed architecture,
routes, deployment setup, and project history. It was originally written for
Claude Code, but its project context applies to every coding agent.

When `CLAUDE.md` conflicts with the current source code, schema, package
configuration, or a newer project document, treat the current implementation as
the source of truth and call out the discrepancy rather than reproducing stale
advice.

## Project principles

- This is a deliberately hand-rolled Nuxt 4 / Vue webshop and club site on
  Cloudflare Pages, D1, R2, and Stripe Checkout. Prefer a small change that fits
  the existing implementation over introducing a library or framework.
- Stripe is the payment, order, and customer-PII system of record. Do not add
  customer or payment data to D1 without explicit approval.
- Prices are stored as integer cents in D1 and shown as euros in the UI. Never
  trust browser-supplied pricing.
- Product and stock changes have real commercial consequences. Do not write to
  the production D1 database, Stripe, or R2 unless the user explicitly asks and
  the exact values/targets are confirmed.

## Local workflow

- Use Corepack Yarn: `corepack yarn <command>`.
- Local secrets are in `.dev.vars`; never display, copy, commit, or log them.
- For Stripe administration, use `bash scripts/stripe-management.sh …`. It
  loads a separate restricted key from macOS Keychain; use the test service by
  default and set `STRIPE_KEYCHAIN_SERVICE=juoksut-stripe-management-live` only
  for an explicitly approved live read. Do not use or expose production
  credentials unless the user explicitly authorizes the exact Stripe action.
- For remote Cloudflare work, use `bash scripts/wrangler-remote.sh …`. It loads
  a locally stored macOS Keychain token; never place that token in this repo or
  an agent prompt. Do not mutate production D1, Pages, or R2 without explicit
  approval of the exact target and action.
- Use `rg` for codebase search.
- Run focused tests after code changes. For changes that can affect deployment,
  run `corepack yarn build` when practical.
- The repository-wide linter has known pre-existing failures. Run lint on the
  files changed by the task, and distinguish pre-existing failures from new ones.

## Database and deployment safety

- `d1/schema.sql` drops tables for local development. Never execute the full
  schema file against `--remote`.
- Production D1 schema changes must use a small, reviewable migration and be
  applied before code that depends on the new column or table.
- Keep `d1/seed.sql` local-only; it is ignored intentionally.

## Checkout and Stripe

- Keep server-side validation of cart items and stock. The signed webhook is
  responsible for post-payment stock changes and must remain idempotent.
- Registration questions (for example a camp shirt size) belong in product
  `checkout_fields` and become required Stripe Checkout fields. Do not overload
  inventory sizes or free-text order notes for structured registration data.
- Checkout collects name and phone number and creates Stripe Customer records;
  treat those fields as personal data in responses, logs, and UI.
- For catalog Stripe Prices, resolve stock through D1's `stripe_price_id`
  mapping before considering Stripe metadata. The mapping is unique; a webhook
  must fail if its expected stock row is not updated.

## Code review rules

- Flag any client-controlled price, unverified Stripe webhook, non-idempotent
  stock mutation, or exposure of customer contact details.
- Flag remote D1 commands that could overwrite or delete existing production
  data, including executing `d1/schema.sql` remotely.
