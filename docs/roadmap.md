# JUOKSUT — Roadmap

> Current as of 25 October 2026. Completed work is retained here so future work
> does not accidentally reintroduce an old problem.

## Recently completed

| Area                     | Status                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Webhook correctness      | Signed raw-payload verification fails loudly if its secret is absent; event IDs are idempotent; a failed stock update releases its claim for retry.                |
| Stripe catalogue mapping | Reusable Stripe Prices map to a unique D1 product price ID; stock updates no longer depend on a manually set Stripe metadata slug.                                 |
| Checkout data            | Checkout validates item shape and quantity, reads the real D1 price, collects name and phone, creates Stripe Customers, and returns generic unexpected errors.     |
| Limited registration     | Thirty-minute capacity reservations, completion/expiry handling, required Stripe dropdown fields, and server-enforced scheduled sale starts are implemented.       |
| Product data             | `d1/schema.sql` is committed; stock has a unique composite index; empty-stock phantom rows are filtered.                                                           |
| Security and SEO         | Security headers are configured, static robots/sitemap and webmanifest are present, and JSON-LD escaping is fixed.                                                 |
| Event signups            | Free event pages with capacity, waitlist and promotion, Gmail API emails, Turnstile, and an Access-protected crew page replace Ticket Tailor (`event-signups.md`). |
| Reliability and tests    | Image probes run in parallel using global fetch; money-path unit tests exist; GitHub Actions runs lint, tests and a production build on every push.                |

The All-Stars Camp 2026 launch uses the limited-registration path: 37 places,
€199, a shirt-size checkout dropdown, 30-minute holds (Stripe Checkout's
minimum), and automatic sale start
at 24 August 2026 12:00 Europe/Helsinki.

## Next sensible work

| Priority | Item                                                    | Why it remains                                                                                                                                                                        |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2       | Improve normal-merch stock concurrency                  | Regular products still decrement only after payment. The reservation solution is enabled only where `reserve_stock = 1`; decide whether all limited merch needs the extra complexity. |
| P2       | Upgrade Nuxt past 4.5                                   | Nuxt 4.6 fails the production prerender of `/` and `/join` with a 500, while dev and the deployed runtime render them fine. Pinned to `~4.5` until the cause is found.                |
| P2       | Verify/review Cloudflare WAF rate limiting periodically | The checkout rate limit is dashboard configuration, not versioned with code. Keep its scope and threshold appropriate around launches.                                                |
| P3       | Instagram cache resilience                              | Add stale-while-revalidate or a refresh lock if cache-miss traffic increases.                                                                                                         |
| P3       | Sanitize product descriptions if authorship expands     | Descriptions are trusted admin HTML today; sanitise before accepting untrusted input.                                                                                                 |
| P3       | Consolidate description formatting                      | Existing catalogue text mixes literal newlines and `<br>` tags.                                                                                                                       |
| P3       | Decide whether cancel should clear the cart             | Keeping the cart after a cancelled Checkout is currently intentional-friendly behaviour.                                                                                              |

## Explicit non-goals unless the need changes

- **First-party order/CRM database:** Stripe is deliberately the order and PII
  system of record. Adding D1 order storage adds GDPR, retention, and access
  control responsibilities. Free event signups are the scoped exception (name
  and email, purged a week after the event).
- **Admin product UI:** targeted D1 commands are safer for the current editing
  frequency than adding authenticated public mutation endpoints. The crew page
  covers events and signups only.
- **Automatic sitemap module:** the current static sitemap is intentionally
  simple; update it manually when public routes change.
