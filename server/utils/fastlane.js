// Free weekly Fastlane Friday signups: confirmed spots up to a session's
// capacity, then a waitlist. Cancelling a confirmed spot promotes the oldest
// waitlisted person. All capacity decisions happen inside one SQL statement so
// concurrent signups cannot oversell a session.

export function helsinkiToday(now = Math.floor(Date.now() / 1000)) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(now * 1000))
  const value = type => parts.find(part => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export async function listSessions(D1, today, now) {
  const { results } = await D1.prepare(`
    SELECT s.id, s.date, s.capacity, s.opens_at,
      (SELECT COUNT(*) FROM fastlane_signups g
        WHERE g.session_id = s.id AND g.status = 'confirmed') AS confirmed,
      (SELECT COUNT(*) FROM fastlane_signups g
        WHERE g.session_id = s.id AND g.status = 'waitlist') AS waitlist
    FROM fastlane_sessions s
    WHERE s.date >= ?
    ORDER BY s.date
  `).bind(today).all()

  return results.map(row => ({
    id: row.id,
    date: row.date,
    capacity: row.capacity,
    confirmed: row.confirmed,
    waitlist: row.waitlist,
    opensAt: row.opens_at,
    state: sessionState(row, now),
  }))
}

export async function signUp(D1, { sessionId, name, email, token, now, today = helsinkiToday(now) }) {
  // One statement decides confirmed vs waitlist from the current confirmed
  // count, so two racing signups cannot both take the last place. A cancelled
  // row may sign up again; that update also re-evaluates capacity.
  const signup = await D1.prepare(`
    INSERT INTO fastlane_signups (session_id, name, email, status, token, created_at)
    SELECT s.id, ?, ?,
      CASE WHEN (
        SELECT COUNT(*) FROM fastlane_signups g
        WHERE g.session_id = s.id AND g.status = 'confirmed'
      ) < s.capacity THEN 'confirmed' ELSE 'waitlist' END,
      ?, ?
    FROM fastlane_sessions s
    WHERE s.id = ? AND s.opens_at <= ? AND s.date >= ?
    ON CONFLICT(session_id, email) DO UPDATE SET
      status = excluded.status,
      token = excluded.token,
      created_at = excluded.created_at
    WHERE fastlane_signups.status = 'cancelled'
    RETURNING status, token
  `).bind(name, email, token, now, sessionId, now, today).first()

  if (signup)
    return { status: signup.status, token: signup.token }

  // No row means: no upcoming session, signups not open yet, or an existing
  // confirmed/waitlisted signup (the upsert above only fires for cancelled).
  const session = await D1.prepare(
    'SELECT opens_at FROM fastlane_sessions WHERE id = ? AND date >= ?',
  ).bind(sessionId, today).first()

  if (!session)
    throw new FastlaneSignupError('not_found')
  if (session.opens_at > now)
    throw new FastlaneSignupError('not_open')

  throw new FastlaneSignupError('already_signed_up')
}

export async function cancelSignup(D1, token, _now = Math.floor(Date.now() / 1000)) {
  // Both statements run as one D1 batch (a transaction): the cancellation and
  // the promotion are either both visible or neither is.
  const cancel = D1.prepare(`
    UPDATE fastlane_signups
    SET status = 'cancelled'
    WHERE token = ? AND status != 'cancelled'
    RETURNING session_id
  `).bind(token)

  // Fill any free capacity from the oldest waitlisted signups. MAX(0, ...)
  // matters: a negative LIMIT in SQLite means "no limit", not "none".
  const promote = D1.prepare(`
    UPDATE fastlane_signups
    SET status = 'confirmed'
    WHERE id IN (
      SELECT id FROM fastlane_signups
      WHERE session_id = (
          SELECT session_id FROM fastlane_signups WHERE token = ? AND status = 'cancelled'
        )
        AND status = 'waitlist'
      ORDER BY created_at, id
      LIMIT COALESCE((
        SELECT MAX(0, s.capacity - (
          SELECT COUNT(*) FROM fastlane_signups g
          WHERE g.session_id = s.id AND g.status = 'confirmed'
        ))
        FROM fastlane_sessions s
        WHERE s.id = (
          SELECT session_id FROM fastlane_signups WHERE token = ? AND status = 'cancelled'
        )
      ), 0)
    )
    RETURNING name, email, token, (
      SELECT date FROM fastlane_sessions WHERE id = fastlane_signups.session_id
    ) AS date
  `).bind(token, token)

  const [cancelled, promoted] = await D1.batch([cancel, promote])

  return {
    cancelled: (cancelled.meta?.changes || 0) > 0,
    promoted: promoted.results?.[0] || null,
  }
}

export async function purgeOldSignups(D1, today) {
  const result = await D1.prepare(`
    DELETE FROM fastlane_signups
    WHERE session_id IN (
      SELECT id FROM fastlane_sessions WHERE date < date(?, '-7 days')
    )
  `).bind(today).run()

  return result.meta?.changes || 0
}

export class FastlaneSignupError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

function sessionState(row, now) {
  if (now < row.opens_at)
    return 'not_open'
  if (row.confirmed >= row.capacity)
    return 'full'
  return 'open'
}
