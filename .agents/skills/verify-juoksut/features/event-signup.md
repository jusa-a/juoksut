# Event pages and signup

Spec: `docs/event-signups.md`. Not built yet on `main`; this file describes the target.

## Sub-features

- Event page `/events/<slug>`: image, text, upcoming dates with spots left / full / opens at.
- Signup form (name, email, Turnstile) → confirmed or waitlist position.
- Cancel page `/signup/cancel?token=…` → button cancels; waitlist promotion.
- `/fastlane-friday` redirects to `/events/fastlane-friday`.

## How to get to it (user POV)

Shop card "Fastlane Friday" or `/join` link → event page → "Sign up" on a date → fill → submit.
Cancel comes from the link in the confirmation email.

## Driving it with Playwright

Seed a page and events in `scripts/verify-fixtures.sql` with times relative to now, so the run
doesn't depend on the calendar (`unixepoch()` + offsets). Use Cloudflare's always-pass Turnstile test
keys in `.dev.vars`. Read the cancel token with `d1("SELECT token FROM signups WHERE email = '…'")`
and open `/signup/cancel?token=<token>` as the email link would.

## Gotchas

- Email isn't sent locally without the Gmail secrets; the handler logs `email not configured`.
  Prove the mail content with the unit tests, not here.
- A full event needs capacity-many signups first: seed them in SQL, then sign up through the page.
