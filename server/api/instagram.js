import { defineEventHandler, getQuery } from 'h3'
import { getCachedMedia } from '../utils/instagram'

const PAGE_SIZE = 12

export default defineEventHandler(async (event) => {
  const { offset = '0', playable = 'false' } = getQuery(event)
  const offsetNum = Number(offset)

  const media = await getCachedMedia(event)
  const videos = media.filter(item => item.media_type === 'VIDEO')
  const playableVideos = playable === 'true' ? videos.filter(video => video.media_url) : videos
  const page = playableVideos.slice(offsetNum, offsetNum + PAGE_SIZE)
  const hasMore = offsetNum + PAGE_SIZE < playableVideos.length

  return { media: page, nextOffset: offsetNum + PAGE_SIZE, hasMore }
})
