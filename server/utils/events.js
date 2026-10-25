// Free event signups: confirmed spots up to an event's capacity, then a
// waitlist. Cancelling a confirmed spot promotes the oldest waitlisted person.
// All capacity decisions happen inside one SQL statement so concurrent signups
// cannot oversell an event.

import { createError } from 'h3'
import { helsinkiToUnix, resolveEventTimes, unixToHelsinki } from './helsinkiTime'

// The public page shows a count only when a session is nearly full; otherwise
// it just says "Sign up" and the real capacity stays private.
const PUBLIC_SPOTS_LIMIT = 10

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
    events: results.map((row) => {
      const state = eventState(row, now)
      const spotsLeft = row.capacity - row.confirmed
      return {
        id: row.id,
        startsAt: row.starts_at,
        venue: row.venue,
        opensAt: row.opens_at,
        state,
        spotsLeft: state === 'open' && spotsLeft <= PUBLIC_SPOTS_LIMIT ? spotsLeft : null,
      }
    }),
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

// --- Crew side -------------------------------------------------------------
// Everything below backs /api/crew/*: event pages, their dated events and the
// people signed up. Times cross the wire as Unix seconds; the crew page turns
// them into Europe/Helsinki wall clocks.

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^\d{2}:\d{2}$/
const week = 7 * 86400

function badRequest(message) {
  return createError({ statusCode: 400, message })
}

function text(value) {
  return typeof value === 'string' ? value : ''
}

function crewPage(row) {
  if (!row)
    return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    summary: row.summary,
    published: row.published === 1,
    venue: row.venue,
    details: row.details,
    capacity: row.capacity,
    startTime: row.start_time,
    opensRule: row.opens_rule,
    promoteRule: row.promote_rule,
  }
}

function crewEvent(row) {
  if (!row)
    return null
  return {
    id: row.id,
    pageId: row.page_id,
    pageSlug: row.page_slug,
    pageTitle: row.page_title,
    startsAt: row.starts_at,
    venue: row.venue,
    details: row.details,
    capacity: row.capacity,
    opensAt: row.opens_at,
    promoteUntil: row.promote_until,
    confirmed: row.confirmed,
    waitlist: row.waitlist,
  }
}

const eventFields = `
  e.id, e.page_id, e.starts_at, e.venue, e.details, e.capacity,
  e.opens_at, e.promote_until
`

const eventCounts = `
  (SELECT COUNT(*) FROM signups s
    WHERE s.event_id = e.id AND s.status = 'confirmed') AS confirmed,
  (SELECT COUNT(*) FROM signups s
    WHERE s.event_id = e.id AND s.status = 'waitlist') AS waitlist
`

export async function listCrewPages(D1) {
  const { results } = await D1.prepare(`
    SELECT id, slug, title, body, image_url, summary, published, venue, details,
      capacity, start_time, opens_rule, promote_rule
    FROM event_pages
    ORDER BY title
  `).all()

  return results.map(crewPage)
}

function pageValues(input) {
  const slug = text(input.slug).trim()
  if (!slugPattern.test(slug))
    throw badRequest('Slug must be lowercase words separated by hyphens')

  const imageUrl = text(input.imageUrl).trim()
  if (imageUrl && !imageUrl.startsWith('https://cdn.juoksut.run/'))
    throw badRequest('Image URL must start with https://cdn.juoksut.run/')

  const capacity = Number(input.capacity)
  if (!Number.isInteger(capacity) || capacity <= 0)
    throw badRequest('Capacity must be a whole number above zero')

  const startTime = text(input.startTime).trim()
  if (!timePattern.test(startTime))
    throw badRequest('Start time must be HH:MM')

  const opensRule = text(input.opensRule).trim()
  const promoteRule = text(input.promoteRule).trim()
  try {
    resolveEventTimes({ start_time: startTime, opens_rule: opensRule, promote_rule: promoteRule }, '2026-01-05')
  }
  catch {
    throw badRequest('Rules must look like "monday 12:00" and "same-day 12:00"')
  }

  const title = text(input.title).trim()
  if (!title)
    throw badRequest('Title is required')
  const summary = text(input.summary).trim()
  if (!summary)
    throw badRequest('Summary is required')

  return [
    slug,
    title,
    text(input.body),
    imageUrl || null,
    summary,
    input.published ? 1 : 0,
    text(input.venue),
    text(input.details),
    capacity,
    startTime,
    opensRule,
    promoteRule,
  ]
}

export async function savePage(D1, input, id = null) {
  const values = pageValues(input)
  let pageId = id

  try {
    if (pageId) {
      const { meta } = await D1.prepare(`
        UPDATE event_pages
        SET slug = ?, title = ?, body = ?, image_url = ?, summary = ?, published = ?,
          venue = ?, details = ?, capacity = ?, start_time = ?, opens_rule = ?, promote_rule = ?
        WHERE id = ?
      `).bind(...values, pageId).run()
      if (!meta.changes)
        throw createError({ statusCode: 404, message: 'No such page' })
    }
    else {
      const { meta } = await D1.prepare(`
        INSERT INTO event_pages
          (slug, title, body, image_url, summary, published, venue, details, capacity,
            start_time, opens_rule, promote_rule)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(...values).run()
      pageId = meta.last_row_id
    }
  }
  catch (error) {
    if (error.statusCode)
      throw error
    if (/UNIQUE/i.test(error.message))
      throw badRequest('That slug is already in use')
    throw error
  }

  return crewPage(await D1.prepare(`
    SELECT id, slug, title, body, image_url, summary, published, venue, details,
      capacity, start_time, opens_rule, promote_rule
    FROM event_pages
    WHERE id = ?
  `).bind(pageId).first())
}

export async function deletePage(D1, id) {
  const { count } = await D1.prepare(
    'SELECT COUNT(*) AS count FROM events WHERE page_id = ?',
  ).bind(id).first()

  if (count)
    throw createError({ statusCode: 409, message: 'Delete this page\'s events first' })

  const { meta } = await D1.prepare('DELETE FROM event_pages WHERE id = ?').bind(id).run()
  if (!meta.changes)
    throw createError({ statusCode: 404, message: 'No such page' })
}

export async function listPageEvents(D1, pageId, now = Math.floor(Date.now() / 1000)) {
  const filter = pageId ? 'e.page_id = ? AND' : ''
  const params = pageId ? [pageId, now - week] : [now - week]

  const { results } = await D1.prepare(`
    SELECT ${eventFields}, ${eventCounts}
    FROM events e
    WHERE ${filter} e.starts_at >= ?
    ORDER BY e.starts_at
  `).bind(...params).all()

  return results.map(crewEvent)
}

export async function getCrewEvent(D1, id) {
  const row = await D1.prepare(`
    SELECT ${eventFields}, ${eventCounts},
      p.slug AS page_slug, p.title AS page_title
    FROM events e
    JOIN event_pages p ON p.id = e.page_id
    WHERE e.id = ?
  `).bind(id).first()

  return crewEvent(row)
}

function addDays(date, days) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
}

function datesToCreate({ date, firstDate, lastDate, skipDates }) {
  const skip = Array.isArray(skipDates) ? skipDates : []
  for (const value of skip) {
    if (!datePattern.test(value))
      throw badRequest('Skipped dates must be YYYY-MM-DD')
  }

  if (date) {
    if (!datePattern.test(date))
      throw badRequest('Date must be YYYY-MM-DD')
    return skip.includes(date) ? [] : [date]
  }

  if (!datePattern.test(text(firstDate)) || !datePattern.test(text(lastDate)))
    throw badRequest('First and last date must be YYYY-MM-DD')
  if (lastDate < firstDate)
    throw badRequest('Last date must not be before the first date')

  // One date per week, same weekday as the first date, inclusive.
  const dates = []
  for (let day = firstDate; day <= lastDate; day = addDays(day, 7)) {
    if (!skip.includes(day))
      dates.push(day)
  }
  return dates
}

function pageTimes(page, date) {
  let times
  try {
    times = resolveEventTimes(page, date)
  }
  catch {
    throw badRequest('This page\'s opening or promotion rule is invalid')
  }
  if (times.promoteUntil > times.startsAt)
    throw badRequest('The promotion deadline falls after the start time')
  return times
}

export async function createEvents(D1, pageId, input = {}) {
  const page = await D1.prepare('SELECT * FROM event_pages WHERE id = ?').bind(pageId).first()
  if (!page)
    throw createError({ statusCode: 404, message: 'No such page' })

  const dates = datesToCreate(input)

  const capacity = input.capacity === undefined || input.capacity === ''
    ? page.capacity
    : Number(input.capacity)
  if (!Number.isInteger(capacity) || capacity <= 0)
    throw badRequest('Capacity must be a whole number above zero')

  const venue = text(input.venue).trim() || page.venue
  const details = text(input.details).trim() || page.details

  const { results: existingRows } = await D1.prepare(
    'SELECT starts_at FROM events WHERE page_id = ?',
  ).bind(pageId).all()
  const taken = new Set(existingRows.map(row => unixToHelsinki(row.starts_at).date))

  const created = []
  const existing = []
  for (const date of dates) {
    if (taken.has(date)) {
      existing.push(date)
      continue
    }

    const { startsAt, opensAt, promoteUntil } = pageTimes(page, date)
    await D1.prepare(`
      INSERT INTO events (page_id, starts_at, venue, details, capacity, opens_at, promote_until)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(pageId, startsAt, venue, details, capacity, opensAt, promoteUntil).run()
    created.push(date)
  }

  return { created, existing }
}

function helsinkiInstant(input, field, current) {
  const date = input[`${field}Date`]
  const time = input[`${field}Time`]
  if (date === undefined && time === undefined)
    return current
  if (!datePattern.test(text(date)) || !timePattern.test(text(time)))
    throw badRequest('Dates must be YYYY-MM-DD and times HH:MM')
  return helsinkiToUnix(date, time)
}

export async function updateEvent(D1, id, input = {}, now = Math.floor(Date.now() / 1000)) {
  const event = await D1.prepare(
    `SELECT ${eventFields}, ${eventCounts} FROM events e WHERE e.id = ?`,
  ).bind(id).first()
  if (!event)
    throw createError({ statusCode: 404, message: 'No such event' })

  const capacity = input.capacity === undefined ? event.capacity : Number(input.capacity)
  if (!Number.isInteger(capacity) || capacity <= 0)
    throw badRequest('Capacity must be a whole number above zero')
  if (capacity < event.confirmed)
    throw createError({ statusCode: 409, message: 'Capacity is below the number of confirmed signups' })

  const startsAt = helsinkiInstant(input, 'startsAt', event.starts_at)
  const opensAt = helsinkiInstant(input, 'opensAt', event.opens_at)
  const promoteUntil = helsinkiInstant(input, 'promoteUntil', event.promote_until)
  if (promoteUntil > startsAt)
    throw badRequest('The promotion deadline must not be after the start time')

  try {
    await D1.prepare(`
      UPDATE events
      SET starts_at = ?, venue = ?, details = ?, capacity = ?, opens_at = ?, promote_until = ?
      WHERE id = ?
    `).bind(
      startsAt,
      input.venue === undefined ? event.venue : text(input.venue).trim(),
      input.details === undefined ? event.details : text(input.details),
      capacity,
      opensAt,
      promoteUntil,
      id,
    ).run()
  }
  catch (error) {
    if (/UNIQUE/i.test(error.message))
      throw createError({ statusCode: 409, message: 'This page already has an event at that time' })
    throw error
  }

  // A raised capacity is a freed spot: fill it from the waitlist, same as a
  // cancellation would.
  const promoted = capacity > event.capacity ? await promoteWaitlist(D1, id, now) : []

  return { event: await getCrewEvent(D1, id), promoted }
}

export async function deleteEvent(D1, id) {
  const { count } = await D1.prepare(`
    SELECT COUNT(*) AS count FROM signups
    WHERE event_id = ? AND status != 'cancelled'
  `).bind(id).first()

  if (count)
    throw createError({ statusCode: 409, message: 'Remove this event\'s signups first' })

  const { meta } = await D1.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
  if (!meta.changes)
    throw createError({ statusCode: 404, message: 'No such event' })
}

export async function listEventSignups(D1, eventId) {
  const { results } = await D1.prepare(`
    SELECT id, name, email, status, created_at
    FROM signups
    WHERE event_id = ? AND status IN ('confirmed', 'waitlist')
    ORDER BY CASE status WHEN 'confirmed' THEN 0 ELSE 1 END, created_at, id
  `).bind(eventId).all()

  return results.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  }))
}

// Same rules as the public cancel link: a started event keeps its signups.
export async function removeSignup(D1, id, now = Math.floor(Date.now() / 1000)) {
  const signup = await D1.prepare(
    'SELECT token FROM signups WHERE id = ? AND status != \'cancelled\'',
  ).bind(id).first()

  if (!signup)
    throw createError({ statusCode: 404, message: 'No such signup' })

  return await cancelSignup(D1, signup.token, now)
}
