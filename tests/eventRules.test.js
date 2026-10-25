import { describe, expect, it } from 'vitest'
import {
  composeOpensRule,
  composePromoteRule,
  parseOpensRule,
  parsePromoteRule,
} from '../utils/eventRules'

describe('opens rule', () => {
  it('parses monday and days-before', () => {
    expect(parseOpensRule('monday 12:00')).toEqual({ kind: 'monday', days: 0, time: '12:00' })
    expect(parseOpensRule('days-before 2 18:00')).toEqual({ kind: 'days-before', days: 2, time: '18:00' })
  })

  it('returns null for anything else', () => {
    expect(parseOpensRule('monday 9:00')).toBeNull()
    expect(parseOpensRule('days-before 18:00')).toBeNull()
    expect(parseOpensRule('same-day 12:00')).toBeNull()
    expect(parseOpensRule('')).toBeNull()
    expect(parseOpensRule(null)).toBeNull()
  })

  it('composes the strings resolveEventTimes reads', () => {
    expect(composeOpensRule({ kind: 'monday', days: 5, time: '12:00' })).toBe('monday 12:00')
    expect(composeOpensRule({ kind: 'days-before', days: 2, time: '18:00' })).toBe('days-before 2 18:00')
  })
})

describe('promote rule', () => {
  it('parses and composes same-day times', () => {
    expect(parsePromoteRule('same-day 12:00')).toBe('12:00')
    expect(composePromoteRule('12:00')).toBe('same-day 12:00')
  })

  it('returns null for anything else', () => {
    expect(parsePromoteRule('monday 12:00')).toBeNull()
    expect(parsePromoteRule('')).toBeNull()
    expect(parsePromoteRule(null)).toBeNull()
  })
})
