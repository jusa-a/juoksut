// Free event signups: confirmed spots up to an event's capacity, then a
// waitlist. Cancelling a confirmed spot promotes the oldest waitlisted person.
// All capacity decisions happen inside one SQL statement so concurrent signups
// cannot oversell an event.

export class EventSignupError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

export async function getPublishedPage(D1, slug, now) {
  const page = await D1.prepare(`
    SELECT id, slug, title, body, image_url, summary
    FROM event_pages
    WHERE slug = ? AND published = 1
  `).bind(slug).first()

  if (!page)
    return null

  const { results } = await D1.prepare(`
    SELECT e.id, e.starts_at, e.venue, e.capacity, e.opens_at,
      (SELECT COUNT(*) FROM signups s
        WHERE s.event_id = e.id AND s.status = 'confirmed') AS confirmed,
      (SELECT COUNT(*) FROM signups s
        WHERE s.event_id = e.id AND s.status = 'waitlist') AS waitlist
    FROM events e
    WHERE e.page_id = ? AND e.starts_at >= ?
    ORDER BY e.starts_at
  `).bind(page.id, now).all()

  return {
    slug: page.slug,
    title: page.title,
    body: page.body,
    imageUrl: page.image_url,
    summary: page.summary,
    events: results.map(row => ({
      id: row.id,
      startsAt: row.starts_at,
      venue: row.venue,
      capacity: row.capacity,
      confirmed: row.confirmed,
      waitlist: row.waitlist,
      opensAt: row.opens_at,
      state: eventState(row, now),
    })),
  }
}

export async function signUp(D1, { eventId, name, email, token, now }) {
  // One statement decides confirmed vs waitlist from the current confirmed
  // count, so two racing signups cannot both take the last place. A cancelled
  // row may sign up again: it gets the new name, a new token and a fresh
  // created_at, so it goes to the back of the queue.
  const signup = await D1.prepare(`
    INSERT INTO signups (event_id, name, email, status, token, created_at)
    SELECT e.id, ?, ?,
      CASE WHEN (
        SELECT COUNT(*) FROM signups s
        WHERE s.event_id = e.id AND s.status = 'confirmed'
      ) < e.capacity THEN 'confirmed' ELSE 'waitlist' END,
      ?, ?
    FROM events e
    WHERE e.id = ? AND e.opens_at <= ? AND ? < e.starts_at
    ON CONFLICT(event_id, email) DO UPDATE SET
      name = excluded.name,
      status = excluded.status,
      token = excluded.token,
      created_at = excluded.created_at
    WHERE signups.status = 'cancelled'
    RETURNING status, token
  `).bind(name, email, token, now, eventId, now, now).first()

  if (signup)
    return { status: signup.status, token: signup.token }

  // No row means: no such event, signups not open yet, the event has started,
  // or an existing confirmed/waitlisted signup (the upsert only fires for
  // cancelled rows).
  const event = await D1.prepare(
    'SELECT opens_at, starts_at FROM events WHERE id = ?',
  ).bind(eventId).first()

  if (!event || event.starts_at <= now)
    throw new EventSignupError('not_found')
  if (event.opens_at > now)
    throw new EventSignupError('not_open')

  throw new EventSignupError('already_signed_up')
}

export async function cancelSignup(D1, token, now = Math.floor(Date.now() / 1000)) {
  // Both statements run as one D1 batch (a transaction): the cancellation and
  // the promotion are either both visible or neither is.
  const cancel = D1.prepare(`
    UPDATE signups
    SET status = 'cancelled'
    WHERE token = ? AND status != 'cancelled'
      AND (SELECT starts_at FROM events WHERE id = signups.event_id) > ?
    RETURNING event_id
  `).bind(token, now)

  const [cancelled, promoted] = await D1.batch([
    cancel,
    promotion(D1, `e.id = (SELECT event_id FROM signups WHERE token = ? AND status = 'cancelled')`, [token], now),
  ])

  return {
    cancelled: (cancelled.meta?.changes || 0) > 0,
    promoted: promoted.results || [],
  }
}

export async function getSignupByToken(D1, token) {
  return await D1.prepare(`
    SELECT p.title, e.starts_at AS startsAt, s.status
    FROM signups s
    JOIN events e ON e.id = s.event_id
    JOIN event_pages p ON p.id = e.page_id
    WHERE s.token = ?
  `).bind(token).first()
}

export async function getEventDetails(D1, eventId) {
  const row = await D1.prepare(`
    SELECT p.title, e.starts_at AS startsAt, e.venue, e.details, e.promote_until AS promoteUntil
    FROM events e
    JOIN event_pages p ON p.id = e.page_id
    WHERE e.id = ?
  `).bind(eventId).first()

  if (!row)
    return null
  return {
    page: { title: row.title },
    event: { startsAt: row.startsAt, venue: row.venue, details: row.details, promoteUntil: row.promoteUntil },
  }
}

export async function promoteWaitlist(D1, eventId, now = Math.floor(Date.now() / 1000)) {
  const { results } = await promotion(D1, 'e.id = ?', [eventId], now).all()
  return results
}

export async function purgeOldSignups(D1, now = Math.floor(Date.now() / 1000)) {
  const result = await D1.prepare(`
    DELETE FROM signups
    WHERE event_id IN (SELECT id FROM events WHERE starts_at < ?)
  `).bind(now - 7 * 86400).run()

  return result.meta?.changes || 0
}

// Fill free capacity from the oldest waitlisted signups, but only while the
// event's promotion window is open. MAX(0, ...) matters: a negative LIMIT in
// SQLite means "no limit", not "none".
function promotion(D1, filter, params, now) {
  return D1.prepare(`
    UPDATE signups
    SET status = 'confirmed'
    WHERE id IN (
      SELECT g.id
      FROM signups g
      JOIN events e ON e.id = g.event_id
      WHERE ${filter} AND g.status = 'waitlist' AND e.promote_until > ?
      ORDER BY g.created_at, g.id
      LIMIT COALESCE((
        SELECT MAX(0, e.capacity - (
          SELECT COUNT(*) FROM signups c
          WHERE c.event_id = e.id AND c.status = 'confirmed'
        ))
        FROM events e
        WHERE ${filter}
      ), 0)
    )
    RETURNING name, email, token, event_id
  `).bind(...params, now, ...params)
}

export function eventState(row, now) {
  if (now < row.opens_at)
    return 'not_open'
  if (row.confirmed >= row.capacity)
    return 'full'
  return 'open'
}
