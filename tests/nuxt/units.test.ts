import { describe, expect, it } from 'vitest'
import { cmToFtIn, formatHeight, ftInToInches, inchesToCm, inchesToFtIn, kgToLb, lbToKg, weightUnit } from '~/utils/units'

describe('weight conversion', () => {
  it('rounds to 1 decimal', () => {
    expect(kgToLb(82)).toBe(180.8)
    expect(lbToKg(180)).toBe(81.6)
  })

  it('round-trips within 0.1', () => {
    for (const kg of [45, 70, 82.1, 120.5]) expect(Math.abs(lbToKg(kgToLb(kg)) - kg)).toBeLessThanOrEqual(0.1)
    expect(kgToLb(lbToKg(154.3))).toBe(154.3)
  })
})

describe('height conversion', () => {
  it('splits cm into whole ft + in', () => {
    expect(cmToFtIn(180)).toEqual({ ft: 5, in: 11 })
    expect(cmToFtIn(165.1)).toEqual({ ft: 5, in: 5 })
  })

  it('carries 12 rounded inches into a foot', () => {
    expect(inchesToFtIn(71.6)).toEqual({ ft: 6, in: 0 })
  })

  it('joins ft + in into total inches', () => {
    expect(ftInToInches(5, 11)).toBe(71)
  })

  it('converts inches to cm with 1 decimal and round-trips', () => {
    expect(inchesToCm(71)).toBe(180.3)
    expect(cmToFtIn(inchesToCm(71))).toEqual({ ft: 5, in: 11 })
  })
})

describe('weightUnit', () => {
  it('maps the unit system to a weight suffix', () => {
    expect(weightUnit('metric')).toBe('kg')
    expect(weightUnit('imperial')).toBe('lb')
  })
})

describe('formatHeight', () => {
  it('formats metric as cm and imperial as ft + in', () => {
    expect(formatHeight({ unitSystem: 'metric', height: 180 })).toBe('180 cm')
    expect(formatHeight({ unitSystem: 'imperial', height: 71 })).toBe('5′ 11″')
  })
})
