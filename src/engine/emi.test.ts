import { describe, expect, it } from 'vitest'
import { calculateEMI } from './emi'

describe('calculateEMI', () => {
  it('matches a hand-computed value for a standard case', () => {
    // 500000 @ 9% p.a. for 60 months -> ~10379.21
    const emi = calculateEMI(500_000, 9, 60)
    expect(emi).toBeCloseTo(10379.21, 1)
  })

  it('falls back to straight-line repayment at 0% interest', () => {
    expect(calculateEMI(120_000, 0, 12)).toBe(10_000)
  })

  it('handles a 1-month tenure', () => {
    // With 1 month, EMI should equal principal * (1 + monthlyRate)
    const emi = calculateEMI(100_000, 12, 1)
    expect(emi).toBeCloseTo(101_000, 0)
  })

  it('returns 0 for non-positive principal or tenure', () => {
    expect(calculateEMI(0, 9, 60)).toBe(0)
    expect(calculateEMI(100_000, 9, 0)).toBe(0)
    expect(calculateEMI(100_000, 9, -5)).toBe(0)
  })

  it('never returns NaN or Infinity for large principal/tenure', () => {
    const emi = calculateEMI(50_00_000, 11.5, 96)
    expect(Number.isFinite(emi)).toBe(true)
  })
})
