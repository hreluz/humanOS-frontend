import { describe, expect, it } from 'vitest'

describe('weekStart', () => {
  it('returns the Monday of the week', () => {
    expect(weekStart(new Date(2026, 6, 8))).toBe('2026-07-06') // Wednesday
    expect(weekStart(new Date(2026, 6, 6))).toBe('2026-07-06') // Monday
  })

  it('treats Sunday as the end of the week', () => {
    expect(weekStart(new Date(2026, 6, 12))).toBe('2026-07-06')
  })

  it('crosses month and year boundaries', () => {
    expect(weekStart(new Date(2026, 6, 1))).toBe('2026-06-29')
    expect(weekStart(new Date(2027, 0, 2))).toBe('2026-12-28')
  })
})

describe('formatWeek', () => {
  it('formats as a short date', () => {
    expect(formatWeek('2026-07-06')).toBe('Jul 6')
  })
})

describe('formatDelta / deltaTone', () => {
  it('formats signed kilograms', () => {
    expect(formatDelta(-0.44, 'kg')).toBe('−0.4 kg')
    expect(formatDelta(0.6, 'kg')).toBe('+0.6 kg')
    expect(formatDelta(0.9, 'lb')).toBe('+0.9 lb')
    expect(formatDelta(0.02, 'lb')).toBe('No change')
  })

  it('is good when moving toward the goal', () => {
    expect(deltaTone(-0.5, 'lose')).toBe('good')
    expect(deltaTone(0.5, 'lose')).toBe('bad')
    expect(deltaTone(0.5, 'build')).toBe('good')
    expect(deltaTone(0.5, 'maintain')).toBe('neutral')
  })
})
