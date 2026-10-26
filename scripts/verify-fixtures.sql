-- Local verification data for the event pages. scripts/verify.mjs loads this
-- into a throwaway local D1 after d1/schema.sql; times are relative to now so
-- a run does not depend on the calendar.

INSERT INTO event_pages (slug, title, body, image_url, summary, published, venue, details, capacity, start_time, opens_rule, promote_rule)
VALUES (
  'fastlane-friday',
  'Fastlane Friday',
  'Fastlane Friday heads outdoors for spring.

16:30 warmup & drills.
17:00 track session. All welcome.',
  'https://cdn.juoksut.run/fastlane-friday.jpg',
  'Weekly speed session. Warmup, drills, track. All welcome.',
  1,
  'Test venue',
  'Test details.',
  3,
  '16:30',
  'monday 12:00',
  'same-day 12:00'
);

-- Open: started a day ago, starts in 3 days, promotions until 2 days from now.
INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, unixepoch() + 3 * 86400, 'Test venue', 'Test details.', 3, unixepoch() - 86400, unixepoch() + 2 * 86400
FROM event_pages WHERE slug = 'fastlane-friday';

-- Full: 3 confirmed of 3 and two on the waitlist, starts in 10 days.
INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, unixepoch() + 10 * 86400, 'Test venue', 'Test details.', 3, unixepoch() - 7 * 86400, unixepoch() + 10 * 86400
FROM event_pages WHERE slug = 'fastlane-friday';

-- Not open yet: opens in 5 days, starts in 17 days.
INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, unixepoch() + 17 * 86400, 'Test venue', 'Test details.', 3, unixepoch() + 5 * 86400, unixepoch() + 17 * 86400
FROM event_pages WHERE slug = 'fastlane-friday';

-- One confirmed signup on the open event (the earliest).
INSERT INTO signups (event_id, name, email, status, token, created_at)
SELECT id, 'Test Runner 1', 'runner1@example.com', 'confirmed', '00000000000000000000000000000001', unixepoch() - 3600
FROM events
WHERE page_id = (SELECT id FROM event_pages WHERE slug = 'fastlane-friday')
ORDER BY starts_at LIMIT 1;

-- Fills the second event: 3 confirmed and 2 waitlisted.
INSERT INTO signups (event_id, name, email, status, token, created_at)
SELECT id, 'Test Runner 2', 'runner2@example.com', 'confirmed', '00000000000000000000000000000002', unixepoch() - 3600
FROM events
WHERE page_id = (SELECT id FROM event_pages WHERE slug = 'fastlane-friday')
ORDER BY starts_at LIMIT 1 OFFSET 1;

INSERT INTO signups (event_id, name, email, status, token, created_at)
SELECT id, 'Test Runner 3', 'runner3@example.com', 'confirmed', '00000000000000000000000000000003', unixepoch() - 3600
FROM events
WHERE page_id = (SELECT id FROM event_pages WHERE slug = 'fastlane-friday')
ORDER BY starts_at LIMIT 1 OFFSET 1;

INSERT INTO signups (event_id, name, email, status, token, created_at)
SELECT id, 'Test Runner 4', 'runner4@example.com', 'confirmed', '00000000000000000000000000000004', unixepoch() - 3600
FROM events
WHERE page_id = (SELECT id FROM event_pages WHERE slug = 'fastlane-friday')
ORDER BY starts_at LIMIT 1 OFFSET 1;

INSERT INTO signups (event_id, name, email, status, token, created_at)
SELECT id, 'Test Runner 5', 'runner5@example.com', 'waitlist', '00000000000000000000000000000005', unixepoch() - 1800
FROM events
WHERE page_id = (SELECT id FROM event_pages WHERE slug = 'fastlane-friday')
ORDER BY starts_at LIMIT 1 OFFSET 1;

INSERT INTO signups (event_id, name, email, status, token, created_at)
SELECT id, 'Test Runner 6', 'runner6@example.com', 'waitlist', '00000000000000000000000000000006', unixepoch() - 1200
FROM events
WHERE page_id = (SELECT id FROM event_pages WHERE slug = 'fastlane-friday')
ORDER BY starts_at LIMIT 1 OFFSET 1;

-- An unpublished page must 404 publicly.
INSERT INTO event_pages (slug, title, body, image_url, summary, published, venue, details, capacity, start_time, opens_rule, promote_rule)
VALUES (
  'draft-event',
  'Draft Event',
  'Draft body.',
  NULL,
  'Draft summary.',
  0,
  'Test venue',
  'Test details.',
  3,
  '16:30',
  'monday 12:00',
  'same-day 12:00'
);

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, unixepoch() + 4 * 86400, 'Test venue', 'Test details.', 3, unixepoch() - 86400, unixepoch() + 2 * 86400
FROM event_pages WHERE slug = 'draft-event';

-- JOIN PAGE

-- A fresh Instagram cache holding this month's two-image schedule carousel, so
-- /join renders the schedule without an Instagram token. The cover and the
-- schedule share the only 4:5 image on the CDN, which is the real aspect.
INSERT INTO instagram_cache (id, videos, cached_at)
VALUES (1, '[{"id":"schedule","caption":"October runs","media_type":"CAROUSEL_ALBUM","permalink":"https://www.instagram.com/p/schedule/","timestamp":"' || strftime('%Y-%m-%dT%H:%M:%S+0000', 'now') || '","children":{"data":[{"media_type":"IMAGE","media_url":"https://cdn.juoksut.run/fastlane-friday.jpg"},{"media_type":"IMAGE","media_url":"https://cdn.juoksut.run/fastlane-friday.jpg"}]}}]', datetime('now'));

-- Two more published events so the events column has a list to scroll past its
-- pinned copy: one with a landscape image, one with none (title fallback).
INSERT INTO event_pages (slug, title, body, image_url, summary, published, venue, details, capacity, start_time, opens_rule, promote_rule)
VALUES (
  'summer-camp',
  'Summer Camp',
  'A weekend out of town.

Trail, sauna, swim.',
  'https://cdn.juoksut.run/og-image.jpg',
  'A weekend of trail runs, sauna and swimming.',
  1,
  'Test venue',
  'Test details.',
  20,
  '10:00',
  'monday 12:00',
  'same-day 12:00'
);

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, unixepoch() + 30 * 86400, 'Test venue', 'Test details.', 20, unixepoch() - 86400, unixepoch() + 30 * 86400
FROM event_pages WHERE slug = 'summer-camp';

INSERT INTO event_pages (slug, title, body, image_url, summary, published, venue, details, capacity, start_time, opens_rule, promote_rule)
VALUES (
  'city-relay',
  'City Relay',
  'Four legs around the city.',
  NULL,
  'A relay around the city.',
  1,
  'Test venue',
  'Test details.',
  40,
  '14:00',
  'monday 12:00',
  'same-day 12:00'
);

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, unixepoch() + 45 * 86400, 'Test venue', 'Test details.', 40, unixepoch() - 86400, unixepoch() + 45 * 86400
FROM event_pages WHERE slug = 'city-relay';
