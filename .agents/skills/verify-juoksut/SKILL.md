---
name: verify-juoksut
description: Run the JUOKSUT site (Nuxt on the local Cloudflare Pages runtime, throwaway D1) and take iPhone-sized screenshots of routes or a scripted user flow. Use to prove a page or UI change works before it ships, or to see what a page looks like now.
---

# Verify the JUOKSUT site

The surface is the public website (and the crew page once it exists), driven with Playwright in an
iPhone 13 viewport against `wrangler pages dev`: the same Workers runtime and D1 binding as
production, with local data only.

## Launch

```sh
node scripts/verify.mjs                    # build, then screenshot / and /shop
node scripts/verify.mjs /join /archive     # chosen routes
node scripts/verify.mjs --no-build /shop   # reuse dist/ from the last build
node scripts/verify.mjs --flow scripts/verify-flows/<name>.mjs
```

Needs Node 24 on `PATH` (`/opt/homebrew/opt/node@24/bin` on the M4; the default `node` may be newer
and lack Corepack) and `node_modules` installed. The script builds (`corepack yarn build`), creates a
fresh local D1 under the evidence folder from `d1/schema.sql`, `d1/seed.sql` (local-only, ignored by
git) and `scripts/verify-fixtures.sql` if present, starts `wrangler pages dev dist` on a free
loopback port, waits until `/` answers, drives, and stops the server. It never touches the developer's
own `.wrangler/state` or any remote database. Secrets come from `.dev.vars`. A run takes about a
minute with the build.

## Doctor

```sh
node -v                                   # v24.x
ls node_modules/.bin/wrangler node_modules/playwright
```

If the server never answers, read `<evidence>/server.log`. Known causes: a stale
`.wrangler/deploy/config.json` pointing at a missing `dist/_worker.js/wrangler.json` (delete it;
`nuxt.config.ts` sets `deployConfig: false` so builds no longer write one), or a missing
`nodejs_compat` flag in `wrangler.toml`.

## Drive

Routes are screenshotted after `networkidle` plus 1.5 s for the `LoadingScreen` fade. For an
interaction, write `scripts/verify-flows/<name>.mjs`:

```js
export default async ({ page, base, shot, d1 }) => {
  await page.goto(`${base}/events/fastlane-friday`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Sign up' }).first().click()
  await page.getByLabel('Name').fill('Verify Runner')
  await shot('signup-form')
  // d1(sql) runs SQL on this run's database and returns wrangler's JSON output
}
```

Find elements the way a person does: `getByRole`, `getByLabel`, visible text. Never call an API
directly to fake a step the user would do in the page.

## Evidence

`.verify/<timestamp>/` (gitignored): one PNG per shot (full page), `manifest.json` (URLs, shots,
browser console errors, `ok`), `server.log`. A proof is the screenshot of the action and of the
resulting state, plus the side effect checked with `d1()` (rows written) where there is one.
Expected noise: `/api/instagram` returns 503 locally (no Instagram token in the seed), so the home
hero falls back to the CDN video.

## Cleanup

The script stops the server it started (process group) even when a step fails. Delete old
`.verify/` folders when done with them; never the one a report cites.

## Feature map

`features/README.md` lists what to drive and how each feature proves itself.
