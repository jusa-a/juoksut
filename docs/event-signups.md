# Event signups

Free signups with a capacity and a waitlist, for any club event (first use: Fastlane Friday). Paid
events stay on Stripe Checkout. Built on the `fastlane-signup` branch; nothing reaches `main` until
the rollout below.

This deliberately narrows two roadmap non-goals: D1 now holds signup PII (name, email), and crew get
a write UI for events. Both are scoped: signups are purged a week after the event, and the crew UI
sits behind Cloudflare Access with the server verifying the Access token.

## Data

Replaces `migrations/20261024_add_fastlane_signups.sql` (never applied to production) with
`migrations/<date>_add_event_signups.sql`.

An **event page** is one public page with one or more dated **events** (a weekly series like
Fastlane Friday, or a one-off with a single date). Creating a page on the crew page publishes it at
`/events/<slug>`; no code change per event.

`event_pages`

| Column                                                                     | Type                       | Notes                                                                             |
| -------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `id`                                                                       | INTEGER PK                 |                                                                                   |
| `slug`                                                                     | TEXT NOT NULL UNIQUE       | `^[a-z0-9]+(-[a-z0-9]+)*$`, e.g. `fastlane-friday`                                |
| `title`                                                                    | TEXT NOT NULL              | Page heading, email subject, crew page                                            |
| `body`                                                                     | TEXT NOT NULL              | Plain text; blank line = paragraph, line break kept. Rendered as text, never HTML |
| `image_url`                                                                | TEXT                       | Must start with `https://cdn.juoksut.run/`; no image when NULL                    |
| `summary`                                                                  | TEXT NOT NULL              | One line; SEO/OG description                                                      |
| `published`                                                                | INTEGER NOT NULL DEFAULT 0 | Unpublished pages 404 publicly; crew can still see them                           |
| `venue`, `details`, `capacity`, `start_time`, `opens_rule`, `promote_rule` |                            | Defaults copied into new events (see below)                                       |

`events`

| Column          | Type             | Notes                                                  |
| --------------- | ---------------- | ------------------------------------------------------ |
| `id`            | INTEGER PK       |                                                        |
| `page_id`       | INTEGER NOT NULL | FK → `event_pages.id`                                  |
| `starts_at`     | INTEGER NOT NULL | Unix seconds; the first time on the schedule (warm-up) |
| `venue`         | TEXT NOT NULL    |                                                        |
| `details`       | TEXT NOT NULL    | Plain-text paragraph(s) for the confirmation email     |
| `capacity`      | INTEGER NOT NULL | `CHECK (capacity > 0)`                                 |
| `opens_at`      | INTEGER NOT NULL | Unix seconds; signups rejected before this             |
| `promote_until` | INTEGER NOT NULL | Unix seconds; `CHECK (promote_until <= starts_at)`     |

`UNIQUE (page_id, starts_at)`. Deleting a page with events is refused.

Page defaults: `start_time` is `HH:MM`; `opens_rule` is `monday HH:MM` (that week's Monday) or
`days-before N HH:MM`; `promote_rule` is `same-day HH:MM`. They only prefill the crew form; each event
stores its own resolved times.

`signups`: `id`, `event_id` (FK → `events.id` ON DELETE CASCADE), `name`, `email` (lowercase),
`status` (`confirmed | waitlist | cancelled`), `token` (32 hex, UNIQUE), `created_at`;
`UNIQUE (event_id, email)`; index `(event_id, status, created_at)`.

All times are Unix seconds. The crew page takes and shows Europe/Helsinki local times; one shared
helper converts both ways and is correct across DST changes (spring 2027: 28 March).

## Rules

Let `now` be the request time.

- **Sign up** while `opens_at <= now < starts_at`. Confirmed if confirmed count < capacity, else
  waitlist, decided in one SQL statement (no overselling under concurrency). Same email twice for
  one event → 409. A cancelled signup may sign up again: it gets a new token, the new name, and goes
  to the back of the queue.
- **Cancel** (token) while `now < starts_at`. After that the link reports the event has started.
- **Promotion**: when a confirmed spot frees up (cancel, crew removal, capacity raised) and
  `now < promote_until`, the oldest waitlisted signups fill the free spots and each gets an email.
  Cancel and promotion run in one D1 batch.
- **After `promote_until`**: no promotions. A freed spot goes to whoever signs up next; the waitlist
  stays as it is.
- **Capacity** can't drop below the current confirmed count (crew page shows the error).
- **Purge**: signups of events whose `starts_at` is more than 7 days ago are deleted; event rows
  stay. Runs opportunistically on the public events request (Pages has no cron).
- **Bot check**: signup requires a valid Cloudflare Turnstile token, verified server-side
  (`siteverify`) before any write. Keep the honeypot.

Fastlane defaults: starts 16:30 Friday, opens `monday 12:00`, promote until `same-day 12:00`,
capacity 40. Venue, details and page text start as last season's and are replaced on the crew page
before the season opens.

## Public side

- `pages/events/[slug].vue` (SSR, for OG tags): image, title, body, then the signup list. Published
  pages only, else 404. Canonical `https://juoksut.run/events/<slug>`.
- `/fastlane-friday` 301-redirects to `/events/fastlane-friday` (route rule); the shop card and
  `/join` link to the new URL. `public/sitemap.xml` lists `/events/fastlane-friday`; other pages are
  added by hand when they matter for search.
- `GET /api/events/<slug>` → the published page's fields and its upcoming events: `id, startsAt,
venue, capacity, confirmed, waitlist, opensAt, state (not_open | open | full)`. No names or emails.
- `POST /api/events/signup` `{ eventId, name, email, website, turnstileToken }` →
  `{ status: 'confirmed' }` or `{ status: 'waitlist', position }`. Errors: 400 invalid, 403 not
  open / bot check failed, 404 no such event, 409 already signed up.
- `GET /api/events/signup?token=` → `{ title, startsAt, status }` for the cancel page (the token is
  the secret; unknown token → 404).
- `POST /api/events/cancel` `{ token }` → `{ cancelled }`; same shape for unknown and already
  cancelled tokens.
- The signup list and form are today's Fastlane page markup, moved into the event page; the old
  `pages/fastlane-friday/` files go.
- `pages/signup/cancel.vue` (`noindex`): shows what the link is for ("your spot" / "your waitlist
  place" for `<title>` on `<date>`) and a button; a network error says to try again, not "invalid".

## Emails

Plain text, built only from the event and its page: confirmed, waitlist and spot-opened mails, each with
the page `<title>`, the date and time, `<venue>`, `<details>` (confirmed and spot-opened only), the cancel
link `<origin>/signup/cancel?token=…` and the sign-off "Lightspeed regards, / Juoksut Crew".

Sent with the Gmail API (`users.messages.send`, scope `gmail.send`) as the sender account:
exchange the refresh token for an access token at `oauth2.googleapis.com/token`, then send a raw
RFC 2822 message (UTF-8 subject encoded per RFC 2047; names can contain ä/ö). `Reply-To` is the
club address. Both are `crew@juoksut.run`: crew@ is a Google Group and can't sign in, so a
Workspace user does the sending with crew@ added as its "Send mail as" address. Missing config logs `email not configured` and skips; a send failure is logged without
recipient or token and never undoes a signup or promotion.

Config: secrets `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`; vars
`EMAIL_FROM`, `EMAIL_REPLY_TO`.

## Crew side

`/crew` and `/api/crew/*`, behind a Cloudflare Access application (policy: emails ending in
`@juoksut.run`; login with Google or a one-time PIN). Every `/api/crew/*` handler verifies the
`Cf-Access-Jwt-Assertion` header (RS256 against the team's `/cdn-cgi/access/certs`, `aud`, `iss`,
`exp`) and returns 403 otherwise; no reliance on Access alone. Vars: `CF_ACCESS_TEAM_DOMAIN`,
`CF_ACCESS_AUD` (production and preview have different Access applications, so different `aud`).

The page (`noindex`, CSR):

- Event pages: create, edit (slug, title, body, image URL, summary, defaults), publish/unpublish,
  with a link to the public page.
- Upcoming and last week's events, grouped by page: date, time, confirmed / capacity, waitlist.
- Per event: confirmed list and waitlist in order (name, email, signup time); remove a signup
  (= cancel, with promotion); edit title, time, venue, details, capacity, opening and promotion
  times; delete an event with no active signups.
- Create one event, or a weekly run: first date, last date, dates to skip, then the fields above
  with the page's defaults; one row per week, each with its times resolved from the page's rules.
- Not now: image upload (images go to R2 by hand, as today), an `/events` index page, rich text.

## Rollout

1. Test database: drop `fastlane_signups`, `fastlane_sessions`; apply the new migration.
2. Google (Workspace admin, once): a Cloud project in the club org with an Internal consent screen
   and the Gmail API enabled; one OAuth client for Access login, one for sending; refresh token for
   the sender account via the OAuth Playground with scope `gmail.send`.
3. Cloudflare: Google as an Access login method; the `/crew` Access application; a Turnstile widget
   for `juoksut.run` and the preview host; secrets and vars for production and preview.
4. Preview end to end on a phone: sign up, waitlist, cancel → promotion mail arrives, crew page.
5. Production: apply the migration with `--remote`, create the Fastlane page and season on the
   crew page, check the
   Stripe webhook still subscribes to its events, merge to `main`.
6. Update `AGENTS.md`, `docs/architecture.md`, `docs/roadmap.md` and the privacy policy (Google as
   email processor, Ticket Tailor removed if nothing uses it).

## Build tasks

Each is one hand-off with its own test bar, in order:

1. **Data and rules**: migration, `server/utils/events.js` (replaces `fastlane.js`), Helsinki time
   helper, public API routes, Turnstile verification, tests for every rule above.
2. **Email**: `server/utils/email.js` on the Gmail API, `server/utils/eventEmails.js` from the event
   row, tests with mocked `fetch`.
3. **Public pages**: `/events/[slug]`, the Fastlane redirect and links, cancel page, Turnstile
   widget, CSP for `challenges.cloudflare.com`.
4. **Crew**: Access JWT verification (same checks as Lightspeed HQ's `worker/src/auth.ts`),
   `/api/crew/*`, `/crew` page.
