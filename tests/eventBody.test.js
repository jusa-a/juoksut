import { describe, expect, it } from 'vitest'
import { eventParagraphs } from '../utils/eventBody'

describe('eventParagraphs', () => {
  it('splits on blank lines and keeps a line break inside a paragraph', () => {
    expect(eventParagraphs('First line\nsecond line\n\nThird.')).toEqual([
      'First line\nsecond line',
      'Third.',
    ])
  })

  it('ignores empty and whitespace-only bodies', () => {
    expect(eventParagraphs('')).toEqual([])
    expect(eventParagraphs('\n \n\n')).toEqual([])
    expect(eventParagraphs(null)).toEqual([])
  })
})
