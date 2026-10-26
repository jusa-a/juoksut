import { defineEventHandler } from 'h3'
import { getCachedMedia, pickSchedulePost } from '../utils/instagram'

// The page shows a fallback when there is no post, so a failed fetch is not an
// error page — it just means "no schedule this month".
export default defineEventHandler(async (event) => {
  try {
    const media = await getCachedMedia(event)
    return { post: pickSchedulePost(media, Date.now()) }
  }
  catch (err) {
    // Message only: the request URL carries the access token.
    console.error('Instagram schedule fetch failed:', err?.message || err)
    return { post: null }
  }
})
