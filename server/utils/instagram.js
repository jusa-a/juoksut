// Instagram bookkeeping shared by /api/instagram and /api/instagram-schedule:
// one cache row holding every post, so the archive and the monthly schedule
// read the same fetch.

import { createError } from 'h3'

const INSTAGRAM_API = 'https://graph.instagram.com'
const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url}'
const CACHE_TTL_MINUTES = 30
const SCHEDULE_MAX_AGE_MS = 45 * 86400000

async function getToken(D1) {
  const row = await D1.prepare('SELECT token, expires_at FROM instagram_token WHERE id = 1').first()
  if (!row)
    throw createError({ statusCode: 503, message: 'Instagram token not configured' })

  let { token } = row
  const daysUntilExpiry = (new Date(row.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)

  if (daysUntilExpiry < 7) {
    try {
      const refreshRes = await fetch(
        `${INSTAGRAM_API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`,
      )
      const refreshData = await refreshRes.json()
      if (refreshData.access_token) {
        token = refreshData.access_token
        const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
        await D1.prepare(
          `UPDATE instagram_token SET token = ?, expires_at = ?, updated_at = datetime('now') WHERE id = 1`,
        ).bind(token, newExpiry).run()
      }
    }
    catch (err) {
      // Log only the message — never the full error, which can carry the
      // token-bearing request URL. (audit L10 / roadmap R21)
      console.error('Instagram token refresh failed:', err?.message || err)
    }
  }

  return token
}

async function fetchAllMedia(token) {
  const media = []
  let cursor = null

  do {
    const cursorParam = cursor ? `&after=${cursor}` : ''
    const res = await fetch(
      `${INSTAGRAM_API}/me/media?fields=${FIELDS}&limit=50${cursorParam}&access_token=${token}`,
    )
    const data = await res.json()
    if (data.error)
      throw createError({ statusCode: 502, message: data.error.message })
    media.push(...(data.data || []))
    cursor = data.paging?.next ? data.paging.cursors?.after : null
  } while (cursor)

  return media
}

async function refreshCache(D1) {
  const token = await getToken(D1)
  const media = await fetchAllMedia(token)
  await D1.prepare(
    `INSERT OR REPLACE INTO instagram_cache (id, videos, cached_at) VALUES (1, ?, datetime('now'))`,
  ).bind(JSON.stringify(media)).run()
  return media
}

export async function getCachedMedia(event) {
  const D1 = event.context.cloudflare?.env?.D1
  if (!D1)
    throw createError({ statusCode: 500, message: 'D1 not available' })

  const cached = await D1.prepare('SELECT videos, cached_at FROM instagram_cache WHERE id = 1').first()
  const cacheAge = cached ? (Date.now() - new Date(cached.cached_at)) / 60000 : Infinity

  if (cached && cacheAge < CACHE_TTL_MINUTES) {
    // Fresh
    return JSON.parse(cached.videos)
  }

  if (cached) {
    // Stale: serve the stale copy immediately and refresh in the background.
    // Coalesce concurrent refreshes with a compare-and-swap on cached_at — only
    // the request whose UPDATE still matches the value we read wins and refreshes;
    // the rest just serve stale and skip. Avoids the thundering herd. (roadmap R20)
    const media = JSON.parse(cached.videos)
    const claim = await D1.prepare(
      `UPDATE instagram_cache SET cached_at = datetime('now') WHERE id = 1 AND cached_at = ?`,
    ).bind(cached.cached_at).run()

    if (claim.meta?.changes === 1) {
      const refresh = refreshCache(D1).catch(err =>
        console.error('Instagram cache refresh failed:', err?.message || err),
      )
      const waitUntil = event.context.cloudflare?.context?.waitUntil?.bind(event.context.cloudflare.context)
      if (waitUntil)
        waitUntil(refresh) // background — don't block the response
      else
        await refresh // dev fallback (no execution context): block so it completes
    }

    return media
  }

  // Cold cache (first ever request): nothing to serve, so fetch synchronously.
  return await refreshCache(D1)
}

const MONTH_IN_CAPTION = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|month)\b/i

// The monthly schedule is a two-image carousel (cover, then schedule), with a
// caption that changes every month, so match its shape instead of the text.
export function pickSchedulePost(media, now) {
  const candidates = media.filter((post) => {
    const children = post.children?.data
    return post.media_type === 'CAROUSEL_ALBUM'
      && children?.length === 2
      && children.every(child => child.media_type === 'IMAGE' && child.media_url)
      && MONTH_IN_CAPTION.test(post.caption || '')
  })

  if (!candidates.length)
    return null

  const newest = candidates.reduce((a, b) =>
    Date.parse(b.timestamp) > Date.parse(a.timestamp) ? b : a)

  if (now - Date.parse(newest.timestamp) > SCHEDULE_MAX_AGE_MS)
    return null

  return {
    permalink: newest.permalink,
    timestamp: newest.timestamp,
    cover: newest.children.data[0].media_url,
    schedule: newest.children.data[1].media_url,
  }
}
