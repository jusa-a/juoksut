CREATE TABLE IF NOT EXISTS event_pages (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    summary TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0,
    venue TEXT NOT NULL,
    details TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    start_time TEXT NOT NULL,
    opens_rule TEXT NOT NULL,
    promote_rule TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    page_id INTEGER NOT NULL,
    starts_at INTEGER NOT NULL,
    venue TEXT NOT NULL,
    details TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    opens_at INTEGER NOT NULL,
    promote_until INTEGER NOT NULL CHECK (promote_until <= starts_at),
    UNIQUE (page_id, starts_at),
    FOREIGN KEY (page_id) REFERENCES event_pages(id)
);

CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    UNIQUE (event_id, email),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signups_event_status
ON signups(event_id, status, created_at);
