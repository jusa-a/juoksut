# Event signups

Lightspeed HQ owns free event signups: event pages, their dated sessions, the signups (name,
email), the confirmation, waitlist and promotion emails, and the purge of signups a week after
their event. Its admin is <https://hq.juoksut.run>.

The site reads and writes all of it through the `HQ` service binding — Lightspeed HQ's
`PublicEvents` entrypoint — configured in `wrangler.toml`:

- `getEvent(slug)` → title, body, image, summary (share text), venue and the upcoming sessions
  with their state (`cancelled | not_open | open | full`) and the spots left.
- `signUp({ sessionId, name, email, website, turnstileToken, ip, origin })` → `confirmed`, or
  `waitlist` with a position. HQ checks the honeypot and Cloudflare Turnstile and sends the mail.
- `getSignup(token)` and `cancel({ token })` for the 32-hex token in the email. HQ promotes the
  oldest waitlisted person and mails them.
- `listEvents()` → published pages with their first and last session times.

The handlers in `server/api/events/` stay thin; `server/utils/hqEvents.js` maps HQ's answers onto
the JSON the pages read.

## Public side

- `pages/events/[slug].vue` (SSR, for OG tags): image, title, body, then the sessions with signup
  and waitlist. A cancelled session says "Cancelled" and offers no signup. Canonical
  `https://juoksut.run/events/<slug>`.
- `/fastlane-friday` 301-redirects to `/events/fastlane-friday` (route rule); the shop card and
  `/join` link to the new URL. `public/sitemap.xml` lists `/events/fastlane-friday`; other pages
  are added by hand when they matter for search.
- `GET /api/events/<slug>` → the page fields, its sessions and the Turnstile site key.
- `POST /api/events/signup` `{ eventId, name, email, website, turnstileToken }` → `confirmed`, or
  `waitlist` with a position; `eventId` is the session id.
- `GET /api/events/signup?token=` → `{ title, startsAt, status, sessionCancelled }`.
- `POST /api/events/cancel` `{ token }` → `{ cancelled }`.
- `pages/signup/cancel.vue` (`noindex`): shows what the link is for ("your spot" / "your waitlist
  place" for `<title>` on `<date>`) and a button; a network error says to try again, not "invalid".
