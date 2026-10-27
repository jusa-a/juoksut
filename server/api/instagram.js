import { defineEventHandler, getQuery } from 'h3'
import { getCachedMedia, scheduleCovers } from '../utils/instagram'

const PAGE_SIZE = 12

export default defineEventHandler(async (event) => {
  const { offset = '0', playable = 'false' } = getQuery(event)
  const offsetNum = Number(offset)

  const media = await getCachedMedia(event)
  const videos = media.filter(item => item.media_type === 'VIDEO')
  // The homepage takes playable videos only; the archive takes every video and
  // each month's schedule cover, newest first.
  const items = playable === 'true'
    ? videos.filter(video => video.media_url)
    : [...videos, ...scheduleCovers(media)].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  const page = items.slice(offsetNum, offsetNum + PAGE_SIZE)
  const hasMore = offsetNum + PAGE_SIZE < items.length

  return { media: page, nextOffset: offsetNum + PAGE_SIZE, hasMore }
})
