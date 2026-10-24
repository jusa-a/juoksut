CREATE TABLE IF NOT EXISTS fastlane_sessions (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    opens_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS fastlane_signups (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    UNIQUE (session_id, email),
    FOREIGN KEY (session_id) REFERENCES fastlane_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fastlane_signups_session_status
ON fastlane_signups(session_id, status, created_at);
