import { describe, expect, it } from 'vitest'
import { LAKH } from './constants'
import { scoreCibil } from './scoring'
import { computeResult } from './scoring'
import { resolveBand } from './constants'
import { LTV_BANDS, TENURE_BANDS, EMI_NMI_BANDS, AGE_BANDS, LOAN_AMOUNT_BANDS } from './constants'
import type { LoanInputs } from './types'

describe('scoreCibil', () => {
  it.each([
    [649, 0],
    [650, 5],
    [710, 5],
    [711, 8],
    [730, 8],
    [731, 12],
    [750, 12],
    [751, 15],
    [770, 15],
    [771, 18],
    [800, 18],
    [801, 20],
    [900, 20],
  ])('cibil=%i -> score %i', (cibil, expected) => {
    expect(scoreCibil(cibil, false)).toBe(expected)
  })

  it('NTC scores 12 regardless of numeric value', () => {
    expect(scoreCibil(0, true)).toBe(12)
    expect(scoreCibil(900, true)).toBe(12)
  })
})

describe('band boundaries', () => {
  it.each([
    [29.99, 18],
    [30, 15],
    [59.99, 15],
    [60, 10],
    [79.99, 10],
    [80, 5],
  ])('LTV=%s%% -> score %i', (ltv, expected) => {
    expect(resolveBand(LTV_BANDS, ltv).score).toBe(expected)
  })

  it.each([
    [59, 15],
    [60, 12],
    [71, 12],
    [72, 10],
    [78, 10],
    [79, 5],
  ])('tenure=%i months -> score %i', (tenure, expected) => {
    expect(resolveBand(TENURE_BANDS, tenure).score).toBe(expected)
  })

  it.each([
    [15, 12],
    [15.01, 8],
    [30, 8],
    [30.01, 4],
  ])('emi/nmi=%s%% -> score %i', (ratio, expected) => {
    expect(resolveBand(EMI_NMI_BANDS, ratio).score).toBe(expected)
  })

  it.each([
    [24, 1],
    [25, 4],
    [39, 4],
    [40, 5],
  ])('age=%i -> score %i', (age, expected) => {
    expect(resolveBand(AGE_BANDS, age).score).toBe(expected)
  })

  it.each([
    [399_999, 5],
    [400_000, 4],
    [749_999, 4],
    [750_000, 3],
    [949_999, 3],
    [950_000, 2],
    [1_599_999, 2],
    [1_600_000, 1],
    [1_799_999, 1],
    [1_800_000, 4],
  ])('loanAmount=Rs%i -> score %i (note: >=18L intentionally jumps to 4)', (amount, expected) => {
    expect(resolveBand(LOAN_AMOUNT_BANDS, amount).score).toBe(expected)
  })
})

const baseInputs: LoanInputs = {
  cibilScore: 760,
  isNtc: false,
  employment: 'PVT_SECTOR_SALARIED',
  exShowroomPrice: 8 * LAKH,
  registrationCharge: 50_000,
  insurance: 30_000,
  loanAmount: 6 * LAKH,
  tenure: 60,
  nmi: 80_000,
  rateOfInterest: 9,
  hasCsp: true,
  age: 35,
}

describe('computeResult', () => {
  it('produces a total equal to the sum of category scores', () => {
    const result = computeResult(baseInputs)
    const sum = result.breakdown.categories.reduce((s, c) => s + c.achieved, 0)
    expect(result.total).toBe(sum)
  })

  it('flags approved when total >= 41', () => {
    const result = computeResult(baseInputs)
    expect(result.approved).toBe(result.total >= 41)
  })

  it('a strong applicant clears the threshold', () => {
    const strong: LoanInputs = {
      ...baseInputs,
      cibilScore: 810,
      employment: 'GOVERNMENT_EMPLOYEE',
      loanAmount: 3 * LAKH,
      tenure: 36,
      nmi: 150_000,
      hasCsp: true,
      age: 42,
    }
    const result = computeResult(strong)
    expect(result.eligibility.eligible).toBe(true)
    expect(result.total).toBeGreaterThanOrEqual(41)
    expect(result.approved).toBe(true)
  })

  it('a weak but still-eligible applicant falls below the threshold on points alone', () => {
    const weak: LoanInputs = {
      ...baseInputs,
      cibilScore: 700,
      employment: 'BUSINESSMAN',
      loanAmount: 7.9 * LAKH,
      tenure: 84,
      nmi: 40_000,
      hasCsp: false,
      age: 22,
    }
    const result = computeResult(weak)
    expect(result.eligibility.eligible).toBe(true)
    expect(result.total).toBeLessThan(41)
    expect(result.approved).toBe(false)
  })

  it('an ineligible applicant is never approved even with a high point total', () => {
    const ineligible: LoanInputs = {
      ...baseInputs,
      cibilScore: 810,
      employment: 'GOVERNMENT_EMPLOYEE',
      loanAmount: 3 * LAKH,
      tenure: 36,
      nmi: 150_000,
      hasCsp: true,
      age: 80, // outside the 21-70 eligible range
    }
    const result = computeResult(ineligible)
    expect(result.total).toBeGreaterThanOrEqual(41)
    expect(result.eligibility.eligible).toBe(false)
    expect(result.approved).toBe(false)
  })
})
