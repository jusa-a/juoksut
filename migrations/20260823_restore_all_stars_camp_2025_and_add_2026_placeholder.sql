-- Corrects the first 2026 placeholder attempt, which accidentally reused the
-- 2025 camp's product row. Keep the completed 2025 registration intact and
-- create a separate, non-purchasable 2026 placeholder.
UPDATE products
SET
  title = 'ALL-STARS CAMP ''25',
  material = NULL,
  sizing = NULL,
  size_chart = NULL,
  description = 'Three days full of guided running sessions, workouts to level up your strength and ofc some off-track activities.
    \n\n
    10.–12. October 2025
    \n\n
    What’s included:\n
    ✅ Accommodation\n
    ✅ Three meals per day\n
    ✅ Full schedule of training sessions & activities
    \n\n
    In addition to the running sessions, the weekend includes runner-specific strength training, body maintenance, relaxation, and group activities with fellow Juoksut runners.
    \n\n
    The All-Stars Camp is open to all Juoksut runners, and everyone is welcome to join. Be prepared for a physically demanding but rewarding weekend!
    \n\n
    ⚡️Limited spots available, be fast!
    \n\n
    So mark your calendars, pack your shoes, and let’s gooooo!
    \n\n
    ‼️Choose your shirt size at checkout‼️ All participants will also get a limited edition All-Stars Camp shirt. 
    ',
  price = 19900,
  stripe_product_id = 'prod_T43AloH1Ga9bYG',
  stripe_price_id = 'price_1S8d6oICzzI70U0fQpBxFMdU',
  checkout_fields = '[{"key":"camp_shirt_size","label":"Camp shirt size","options":["XS","S","M","L","XL"]}]'
WHERE slug = 'all-stars-camp';

UPDATE stock
SET quantity = 20
WHERE product_slug = 'all-stars-camp' AND size = 'ONE-SIZE';

INSERT INTO products (
  slug,
  title,
  description,
  price,
  stripe_product_id,
  stripe_price_id,
  checkout_fields
)
VALUES (
  'all-stars-camp-2026',
  'ALL-STARS CAMP ''26',
  'All details and registration coming soon.',
  0,
  NULL,
  NULL,
  '[{"key":"camp_shirt_size","label":"Camp shirt size","options":["XS","S","M","L","XL"]}]'
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  stripe_product_id = excluded.stripe_product_id,
  stripe_price_id = excluded.stripe_price_id,
  checkout_fields = excluded.checkout_fields;

INSERT INTO stock (product_slug, size, quantity)
VALUES ('all-stars-camp-2026', 'ONE-SIZE', -1)
ON CONFLICT(product_slug, size) DO UPDATE SET quantity = excluded.quantity;
