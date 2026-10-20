import { describe, expect, it } from 'vitest'
import { INGREDIENTS } from '~/services/mocks/ingredients'

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

describe('INGREDIENTS', () => {
  it('gives every catalog record a known category', () => {
    const keys = CATEGORIES.map(c => c.key)
    for (const item of INGREDIENTS) expect(keys, item.id).toContain(item.category)
  })
})
