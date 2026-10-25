# Shop

## Sub-features

- Product grid (`/shop`), newest first, with price or OUT OF STOCK.
- Product page (`/shop/<slug>`): images, size picker, add to cart, cart drawer.

## How to get to it (user POV)

Nav "SHOP", then tap a product.

## Driving it with Playwright

```js
await page.goto(`${base}/shop`, { waitUntil: 'networkidle' })
await page.getByRole('link', { name: /ALL-STARS CAMP/ }).first().click()
await shot('product')
```

Products come from the local `d1/seed.sql`; check it for slugs and stock before asserting.

## Gotchas

- Checkout goes to Stripe test mode via `.dev.vars`; stop at the Stripe redirect, don't pay.
- Images load from `cdn.juoksut.run` (live CDN), so a missing image is a CDN fact, not a local bug.
