---
name: JUOKSUT
description: Run club site and shop, one pink on white.
colors:
  pink: "#FF639A"
  white: "#FFFFFF"
typography:
  wordmark:
    fontFamily: "JUOKSUT Garamond, Georgia, serif"
    fontWeight: 500
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Inter, Helvetica, Arial, sans-serif"
    fontSize: "calc(0.875em + 0.390625vw)"
    fontWeight: 400
  heading:
    fontFamily: "Inter, Helvetica, Arial, sans-serif"
    fontSize: "1.3em"
    fontWeight: 500
  label:
    fontFamily: "Inter, Helvetica, Arial, sans-serif"
    fontSize: "0.8em"
rounded:
  none: "0"
components:
  button-primary:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
  button-primary-hover:
    backgroundColor: "{colors.white}"
    textColor: "{colors.pink}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.pink}"
    rounded: "{rounded.none}"
---

# Design System: JUOKSUT

Describes the site as built; when the code and this file disagree, the code wins and this file gets
updated. Sources: `assets/css/tailwind.css`, `tailwind.config.js`, `components/`.

## Colors

One color. Text, lines, buttons and table headers are pink (`#FF639A`) on white; white text only on
a pink fill. No greys, no second accent. Error text is the only exception (`text-red-500`).

## Typography

- **Inter** for everything readable: body 400, headings 500, labels and buttons uppercase.
- **JUOKSUT Garamond** (self-hosted, 500 is the custom cut) only for the wordmark, the footer line
  and display moments on `/` and `/join`, with tight tracking (-0.03 to -0.04em). The nav wordmark
  and the active nav link are skewed (-8° / -10°).
- Body size scales with the viewport (`calc(0.875em + 0.390625vw)`); sizes elsewhere are in `em`.

## Layout

- Text pages sit in a centered `section`: `clamp(50%, 500px, 100%)` wide, `1em` side padding.
- Product and event pages: image left, text right, wrapping to one column on phones; the text
  column is sticky below the nav on wider screens.
- The nav is sticky with a 1px pink divider under it; height `--nav-height`.
- Dividers always run edge to edge of their column or the screen, like the nav's; never inset by
  the side padding. Content inside carries its own padding (list rows, forms).

## Elevation & Depth

Flat. No shadows, no gradients. Separation is a 1px pink line or a pink border.

## Shapes

Square corners everywhere. Borders are 1px pink.

## Components

- **Buttons:** full pink with white uppercase text, or white with pink border and text; hover swaps
  the two; `active:opacity-50`. Touch targets at least 44px tall.
- **Inputs:** 1px pink border, white fill, square, 44px tall, pink focus outline.
- **Lists and cards:** 1px pink border boxes; product cards get the border on hover only.
- **Links:** underlined in running text; `opacity: 70%` on hover where hover exists.
- The cursor is `crosshair`, and `cell` on links and buttons. Scrollbars are hidden.

## Do's and Don'ts

### Do:

- **Do** use only pink and white, Inter for UI text, square 1px-bordered controls.
- **Do** let crew screens (`/crew`) be denser and more app-like (lists, tables, inline actions)
  with the same colors, type and borders.

### Don't:

- **Don't** add rounded corners, shadows, gradients, greys or a second brand color.
- **Don't** use Garamond for body text, labels or controls.
