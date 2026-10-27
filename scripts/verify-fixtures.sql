-- Local verification data. scripts/verify.mjs loads this into a throwaway local
-- D1 after d1/schema.sql; times are relative to now so a run does not depend on
-- the calendar. Events and signups live in Lightspeed HQ, not here.

-- A fresh Instagram cache holding this month's two-image schedule carousel, so
-- /join renders the schedule without an Instagram token. The cover and the
-- schedule share the only 4:5 image on the CDN, which is the real aspect.
INSERT INTO instagram_cache (id, videos, cached_at)
VALUES (1, '[{"id":"schedule","caption":"October runs","media_type":"CAROUSEL_ALBUM","permalink":"https://www.instagram.com/p/schedule/","timestamp":"' || strftime('%Y-%m-%dT%H:%M:%S+0000', 'now') || '","children":{"data":[{"media_type":"IMAGE","media_url":"https://cdn.juoksut.run/fastlane-friday.jpg"},{"media_type":"IMAGE","media_url":"https://cdn.juoksut.run/fastlane-friday.jpg"}]}}]', datetime('now'));

