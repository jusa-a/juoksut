-- Public placeholder copy while final price and capacity are still pending.
-- The product remains unavailable because its stock stays at -1.
UPDATE products
SET
  title = 'ALL-STARS CAMP ''26',
  description = 'Last year was all-star magic. This autumn, we are heading back for another weekend of miles, movement, good food and the kind of camp energy that lasts long after the final run.\n\n16.–18. October 2026\nVihtijärvi\n\nWhat’s included:\n✅ Accommodation\n✅ Three meals per day\n✅ A full schedule of training sessions and activities\n✅ A limited edition ALL-STARS CAMP shirt\n\nExpect guided running sessions, runner-specific strength training, body maintenance, recovery, relaxation and off-track activities with your fellow Juoksut runners.\n\nThe All-Stars Camp is open to all Juoksut runners. Come ready for a physically demanding, deeply fun and very rewarding weekend.\n\n⚡️ Limited spots available — be fast when registration opens.\n\nChoose your camp shirt size at checkout.',
  checkout_fields = '[{"key":"camp_shirt_size","label":"Camp shirt size","options":["XS","S","M","L","XL"]}]'
WHERE slug = 'all-stars-camp-2026';
