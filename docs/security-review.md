# JUOKSUT — Security posture

> This replaces the historical audit backlog. It records the current state as
> of 23 August 2026; review it after meaningful checkout, hosting, or access
> changes.

## Current controls

- Prices and stock are read again from D1 on the server. Client cart prices are
  display data only.
- Stripe webhook payloads are verified from the raw body. A missing webhook
  signing secret fails with an error instead of returning a false success.
- Webhook event IDs are recorded before mutation, so Stripe retries do not
  double-decrement stock. A failed mutation releases the ID for a later retry.
- Pre-created Stripe Prices map back to D1 via the unique `stripe_price_id`.
  Inline prices retain item metadata as a fallback; manual Stripe metadata is
  not the inventory source of truth.
- Limited registrations use atomic ten-minute D1 holds. Completion finalises a
  hold and expiry releases it. The Stripe destination must receive both
  `checkout.session.completed` and `checkout.session.expired`.
- Checkout validates a non-empty bounded cart and positive integer quantities.
  Unexpected server errors are not passed through to the shopper.
- The order-details endpoint exposes only the name, email, and order lines the
  success page needs—not phone, address, or other Stripe customer fields.
- Security headers are applied through Nuxt route rules: `nosniff`, strict
  referrer policy, same-origin framing, and a report-only CSP. Observe CSP
  violations before enforcing it.
- Cloudflare has a checkout WAF rate-limit rule. It is operational configuration
  and must be reviewed in the dashboard because it is not represented in Git.
- Secrets are server-side only. `.dev.vars`/`.env*` are ignored; production
  secrets are Cloudflare Pages environment variables.

## Residual risks and accepted trade-offs

| Risk | Current position |
| --- | --- |
| Concurrent normal-merch checkout | Normal merchandise has a small last-unit oversell window because it changes stock after payment. Use `reserve_stock = 1` for constrained registration/capacity products. |
| Trusted HTML descriptions | Product descriptions use `v-html`; only trusted administrators may write them. Introduce sanitisation before accepting user/third-party content. |
| Stripe success URL | A high-entropy session ID is in the success URL. The endpoint now minimises its returned PII; users should still avoid sharing the URL. |
| Instagram token in D1 | The token is server-only but stored plaintext in D1 and used with the Graph API. Its scope is limited to the public feed; log carefully and rotate if exposed. |
| Report-only CSP | It does not block violations yet. Enforcement needs a reviewed allowlist because Nuxt and embeds use inline/third-party resources. |

## Access policy for coding agents

It is appropriate for this public repository to document the access *method*,
the wrapper commands, and Keychain service names. It is never appropriate to
commit or paste an API token, Stripe secret key, webhook signing secret,
Keychain output, customer data, or a full account export.

- Cloudflare credentials are held locally under
  `juoksut-cloudflare-api-token`; use `scripts/wrangler-remote.sh` and restrict
  the token to the JUOKSUT account, named resources, and the least permissions.
- Stripe management credentials are held locally under
  `juoksut-stripe-management-test` (and optionally the explicitly authorised
  live service `juoksut-stripe-management-live`); use
  `scripts/stripe-management.sh`.
- Treat production D1, R2, Cloudflare Pages, and live Stripe mutations as a
  separate approval boundary. Obtain explicit approval for the exact action,
  then use the narrowest action possible.
