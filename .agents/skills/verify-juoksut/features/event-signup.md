# Event pages and signup

Spec: `docs/event-signups.md`. Lightspeed HQ owns the event pages, sessions and signups; the site
reaches them only through the `HQ` service binding.

## Sub-features

- Event page `/events/<slug>`: image, text, upcoming dates with spots left / full / opens at.
- Signup form (name, email, Turnstile) → confirmed or waitlist position.
- Cancel page `/signup/cancel?token=…` → button cancels; waitlist promotion.
- `/fastlane-friday` redirects to `/events/fastlane-friday`.
- `/join` lists the published events as cards.

## How to get to it (user POV)

`/join` event card → event page → "Sign up" on a date → fill → submit. Cancel comes from the link
in the confirmation email.

## Driving it with Playwright

The local D1 holds no events, so `scripts/verify.mjs` alone can't reach them: without HQ behind
the binding, `/api/events` fails and `/join` hides its events section. Drive event pages and
signups against a preview deploy, whose binding points at `lightspeed-hq-preview`; create the test
event and read signups in `hq-preview.juoksut.run`.

## Gotchas

- HQ sends the mails; prove their content with HQ's own tests, not here.
- A full event needs capacity-many signups first: set a small capacity in HQ, then sign up through
  the page.
