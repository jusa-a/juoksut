-- Fastlane Friday 2026-27 page and its first dates (30.10.-18.12.2026; 25.12. skipped).
-- Apply after 20261025_add_event_signups.sql. Times are Unix seconds, Europe/Helsinki:
-- start 17:00, signups open Monday 16:00, waitlist promotion until Friday 12:00.

INSERT INTO event_pages (slug, title, body, image_url, summary, published, venue, details, capacity, start_time, opens_rule, promote_rule)
VALUES ('fastlane-friday', 'FASTLANE FRIDAY', 'Powered by Suunto🔺

Every Friday at the Olympic Stadium''s tunnel

17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

Sign up as fast as you can every Monday 16:00
🥵🫵🫦💫☄️', 'https://cdn.juoksut.run/fastlane-friday-2027.jpeg', 'Indoor track session every Friday at the Olympic Stadium tunnel, powered by Suunto. Sign up Mondays 16:00.', 1, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, '17:00', 'monday 16:00', 'same-day 12:00');

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, 1793372400, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, 1793023200, 1793354400 FROM event_pages WHERE slug = 'fastlane-friday';

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, 1793977200, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, 1793628000, 1793959200 FROM event_pages WHERE slug = 'fastlane-friday';

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, 1794582000, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, 1794232800, 1794564000 FROM event_pages WHERE slug = 'fastlane-friday';

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, 1795186800, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, 1794837600, 1795168800 FROM event_pages WHERE slug = 'fastlane-friday';

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, 1795791600, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, 1795442400, 1795773600 FROM event_pages WHERE slug = 'fastlane-friday';

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, 1796396400, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, 1796047200, 1796378400 FROM event_pages WHERE slug = 'fastlane-friday';

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, 1797001200, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, 1796652000, 1796983200 FROM event_pages WHERE slug = 'fastlane-friday';

INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
SELECT id, 1797606000, 'Olympic Stadium tunnel', '17:00 Outdoor warmup
17:30 Indoor track session
+ optional afters at Zuhat

We''re many runners with different levels of experience, so let''s keep it positive, respectful and safe for everyone. Our Safer Space guidelines: https://juoksut.run/join', 45, 1797256800, 1797588000 FROM event_pages WHERE slug = 'fastlane-friday';
