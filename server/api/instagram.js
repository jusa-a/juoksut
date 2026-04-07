import { defineEventHandler, createError, getQuery } from 'h3'

const INSTAGRAM_API = 'https://graph.instagram.com'
const FIELDS = 'id,media_type,media_url,thumbnail_url,permalink,timestamp'

export default defineEventHandler(async (event) => {
  const D1 = event.context.cloudflare?.env?.D1
  if (!D1) {
    throw createError({ statusCode: 500, message: 'D1 not available' })
  }

  const row = await D1.prepare('SELECT token, expires_at FROM instagram_token WHERE id = 1').first()
  if (!row) {
    throw createError({ statusCode: 503, message: 'Instagram token not configured' })
  }

  let { token } = row
  const expiresAt = new Date(row.expires_at)
  const daysUntilExpiry = (expiresAt - Date.now()) / (1000 * 60 * 60 * 24)

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
      console.error('Instagram token refresh failed:', err)
    }
  }

  const { cursor } = getQuery(event)
  const cursorParam = cursor ? `&after=${cursor}` : ''

  const res = await fetch(
    `${INSTAGRAM_API}/me/media?fields=${FIELDS}&limit=50${cursorParam}&access_token=${token}`,
  )
  const data = await res.json()

  if (data.error) {
    throw createError({ statusCode: 502, message: data.error.message })
  }

  const media = (data.data || []).filter(m => m.media_type === 'VIDEO')
  const nextCursor = data.paging?.cursors?.after || null
  const hasMore = !!data.paging?.next

  return { media, nextCursor, hasMore }
})
