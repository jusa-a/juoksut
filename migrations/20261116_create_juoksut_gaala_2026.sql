-- JUOKSUT GAALA '26: a limited paid registration, one place per checkout.
-- Sales open at 20:00 Europe/Helsinki on 16 November 2026 (18:00 UTC).
INSERT INTO products (
  slug,
  title,
  description,
  price,
  stripe_product_id,
  stripe_price_id,
  checkout_fields,
  reserve_stock,
  sales_start_at
)
VALUES (
  'juoksut-gaala-2026',
  'JUOKSUT GAALA ''26',
  'Let’s celebrate the year of success together at Hietsun Paviljonki on the 3rd of December.\n\nDoors open at 6:30pm and the toast is raised at 7pm, so you are in no rush finding your seat. Juoksut Crew has cooked a delish long table dinner for you and your friends. After dinner the night will continue with Juoksut awards and culminate in some late night karaoke.\n\nLast call will be at 1 am, so there will be plenty of time to enjoy the company of other lightspeeders. There will be some refreshments served, but if you are feeling festive, byob!\n\nWhere: Hietsun Paviljonki, Hiekkarannantie 9, 00100 Helsinki\nWhen: 3.12.2026 6:30pm–1:00am\nWhat: A long table dinner served with some awards\nDresscode: Festive\nWho should attend: Any 18+ lightspeeder who wants to celebrate the year together\n\nAll dishes served will be meat free. Tell us your dietary needs and what you’d like in your glass for the toast at checkout; allergies go in the order note.\n\n⚡️ Limited spots available, so you better be fast!',
  3500,
  NULL,
  NULL,
  '[{"key":"diet","label":"Dietary requirements (all dishes are meat free)","options":["None","Vegetarian","Vegan","Gluten free","Lactose free","Other or several (tell us in the order note)"]},{"key":"toast_drink","label":"In your glass for the toast","options":["Alcoholic","Non-alcoholic","Just water for me, thanks!"]}]',
  1,
  1794852000
);

INSERT INTO stock (product_slug, size, quantity)
VALUES ('juoksut-gaala-2026', 'ONE-SIZE', 40);
