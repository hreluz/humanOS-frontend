import { describe, expect, it } from 'vitest'

describe('CATEGORIES', () => {
  it('has 13 unique keys, ending with other', () => {
    expect(CATEGORIES).toHaveLength(13)
    expect(new Set(CATEGORIES.map(c => c.key)).size).toBe(13)
    expect(CATEGORIES.at(-1)!.key).toBe('other')
  })
})

describe('categoryLabel', () => {
  it('returns the label for a key', () => {
    expect(categoryLabel('fats')).toBe('Fats & nuts')
  })
})
