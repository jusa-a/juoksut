import { describe, expect, it } from 'vitest'
import { eventStatus } from '../server/utils/events'

const now = 1000000

describe('eventStatus', () => {
  it('is upcoming when the first event is in the future', () => {
    expect(eventStatus(1000001, 2000000, now)).toBe('upcoming')
  })

  it('is current when the first event starts now', () => {
    expect(eventStatus(1000000, 2000000, now)).toBe('current')
  })

  it('is current when the last event starts now', () => {
    expect(eventStatus(500000, 1000000, now)).toBe('current')
  })

  it('stays current exactly 86400 seconds after the last event', () => {
    expect(eventStatus(500000, 913600, now)).toBe('current')
  })

  it('is past a second after that', () => {
    expect(eventStatus(500000, 913599, now)).toBe('past')
  })
})
