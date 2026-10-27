import { describe, expect, it } from 'vitest'
import { pickSchedulePost, scheduleCovers } from '../server/utils/instagram'

const now = Date.parse('2026-10-26T12:00:00Z')

function carousel({ timestamp, caption, children }) {
  return {
    media_type: 'CAROUSEL_ALBUM',
    timestamp,
    caption,
    permalink: `https://www.instagram.com/p/${timestamp}`,
    children: { data: children },
  }
}

const image = url => ({ media_type: 'IMAGE', media_url: url })
const twoImages = (prefix = 'img') => [image(`https://cdninstagram.com/${prefix}/1`), image(`https://cdninstagram.com/${prefix}/2`)]

describe('pickSchedulePost', () => {
  it('takes the newest matching carousel', () => {
    const october = carousel({
      timestamp: '2026-10-08T10:27:00+0000',
      caption: 'October👆📊🗂️📮',
      children: twoImages('october'),
    })
    const september = carousel({
      timestamp: '2026-09-04T13:31:00+0000',
      caption: 'It’s September & we’re back on track',
      children: twoImages('september'),
    })

    expect(pickSchedulePost([september, october], now)).toEqual({
      permalink: october.permalink,
      timestamp: october.timestamp,
      cover: october.children.data[0].media_url,
      schedule: october.children.data[1].media_url,
    })
  })

  it('matches a loose month caption', () => {
    const post = carousel({
      timestamp: '2026-10-08T10:27:00+0000',
      caption: 'Nice month ahead 💞',
      children: twoImages(),
    })

    expect(pickSchedulePost([post], now)).not.toBeNull()
  })

  it('rejects a caption naming two months', () => {
    const post = carousel({
      timestamp: '2026-10-08T10:27:00+0000',
      caption: 'Juoksut presents: FASTLANE FRIDAY. Starting 7.11. From November to March.',
      children: twoImages(),
    })

    expect(pickSchedulePost([post], now)).toBeNull()
  })

  it('counts May only with a capital', () => {
    const june = carousel({ timestamp: '2026-10-08T10:27:00+0000', caption: 'June is here, you may join any run', children: twoImages() })
    const may = carousel({ timestamp: '2026-10-08T10:27:00+0000', caption: 'May\u2019s agenda here for you', children: twoImages() })
    const twoMonths = carousel({ timestamp: '2026-10-08T10:27:00+0000', caption: 'From May to June', children: twoImages() })

    expect(pickSchedulePost([june], now)).not.toBeNull()
    expect(pickSchedulePost([may], now)).not.toBeNull()
    expect(pickSchedulePost([twoMonths], now)).toBeNull()
  })

  it('matches month, months and monthly', () => {
    for (const caption of ['This month', 'Two months in', 'The MONTHLY plan']) {
      const post = carousel({ timestamp: '2026-10-08T10:27:00+0000', caption, children: twoImages() })
      expect(pickSchedulePost([post], now)).not.toBeNull()
    }
  })

  it('rejects a carousel of three images', () => {
    const post = carousel({
      timestamp: '2026-10-08T10:27:00+0000',
      caption: 'October',
      children: [...twoImages(), image('https://cdninstagram.com/img/3')],
    })

    expect(pickSchedulePost([post], now)).toBeNull()
  })

  it('takes a caption that names no month', () => {
    const post = carousel({
      timestamp: '2026-10-08T10:27:00+0000',
      caption: 'Dreams come true at Tokoinranta',
      children: twoImages(),
    })

    expect(pickSchedulePost([post], now)).not.toBeNull()
  })

  it('rejects a carousel whose second child is a video', () => {
    const post = carousel({
      timestamp: '2026-10-08T10:27:00+0000',
      caption: 'October',
      children: [image('https://cdninstagram.com/img/1'), { media_type: 'VIDEO', media_url: 'https://cdninstagram.com/video/2' }],
    })

    expect(pickSchedulePost([post], now)).toBeNull()
  })

  it('rejects a video with a month caption', () => {
    expect(pickSchedulePost([{ media_type: 'VIDEO', caption: 'October', timestamp: '2026-10-08T10:27:00+0000' }], now)).toBeNull()
  })

  it('accepts a post exactly 45 days old and rejects one a millisecond older', () => {
    const at = new Date(now - 45 * 86400000).toISOString()
    const post = carousel({ timestamp: at, caption: 'October', children: twoImages() })
    const older = carousel({ timestamp: new Date(now - 45 * 86400000 - 1).toISOString(), caption: 'October', children: twoImages() })

    expect(pickSchedulePost([post], now)).not.toBeNull()
    expect(pickSchedulePost([older], now)).toBeNull()
  })

  it('returns null for an empty media list', () => {
    expect(pickSchedulePost([], now)).toBeNull()
  })
})

describe('scheduleCovers', () => {
  it('gives every schedule post\'s cover as an image item', () => {
    const october = carousel({ timestamp: '2026-10-08T10:27:00+0000', caption: 'October', children: twoImages('october') })
    const photos = carousel({ timestamp: '2026-10-10T10:00:00+0000', caption: 'Race day', children: [...twoImages('race'), image('https://cdninstagram.com/race/3')] })

    expect(scheduleCovers([october, photos])).toEqual([{
      id: undefined,
      media_type: 'IMAGE',
      media_url: 'https://cdninstagram.com/october/1',
      permalink: october.permalink,
      timestamp: october.timestamp,
    }])
  })
})
