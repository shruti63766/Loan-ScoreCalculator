import { describe, expect, it } from 'vitest'
import { APPROVAL_THRESHOLD, LAKH } from '../constants'
import { computeResult } from '../scoring'
import type { LoanInputs } from '../types'
import { findSuggestions } from './search'

const weakInputs: LoanInputs = {
  cibilScore: 720,
  isNtc: false,
  employment: 'PROFESSIONAL',
  exShowroomPrice: 19 * LAKH,
  registrationCharge: 60_000,
  insurance: 40_000,
  loanAmount: 17 * LAKH,
  tenure: 84,
  nmi: 70_000,
  rateOfInterest: 10,
  hasCsp: false,
  age: 30,
}

describe('findSuggestions', () => {
  it('returns no suggestions when already approved', () => {
    const approved: LoanInputs = { ...weakInputs, loanAmount: 2 * LAKH, tenure: 36, cibilScore: 810, hasCsp: true }
    const result = computeResult(approved)
    expect(result.eligibility.eligible).toBe(true)
    expect(result.total).toBeGreaterThanOrEqual(41)
    expect(
      findSuggestions(approved, result.valueOfCar, result.total, result.eligibility.eligible, APPROVAL_THRESHOLD),
    ).toEqual([])
  })

  it('every returned suggestion actually recomputes to eligible and >= threshold', () => {
    const base = computeResult(weakInputs)
    const suggestions = findSuggestions(
      weakInputs,
      base.valueOfCar,
      base.total,
      base.eligibility.eligible,
      APPROVAL_THRESHOLD,
    )
    for (const s of suggestions) {
      const verify = computeResult({ ...weakInputs, loanAmount: s.loanAmount, tenure: s.tenure, nmi: s.nmi })
      expect(verify.eligibility.eligible).toBe(true)
      expect(verify.total).toBeGreaterThanOrEqual(APPROVAL_THRESHOLD)
      expect(verify.total).toBe(s.result.total)
    }
  })

  it('never suggests raising the loan amount above the original', () => {
    const base = computeResult(weakInputs)
    const suggestions = findSuggestions(
      weakInputs,
      base.valueOfCar,
      base.total,
      base.eligibility.eligible,
      APPROVAL_THRESHOLD,
    )
    for (const s of suggestions) {
      expect(s.loanAmount).toBeLessThanOrEqual(weakInputs.loanAmount)
    }
  })

  it('ranks fewer-lever suggestions above more-lever ones', () => {
    const base = computeResult(weakInputs)
    const suggestions = findSuggestions(
      weakInputs,
      base.valueOfCar,
      base.total,
      base.eligibility.eligible,
      APPROVAL_THRESHOLD,
    )
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i].leverCount).toBeGreaterThanOrEqual(suggestions[i - 1].leverCount)
    }
  })

  it('changing NMI alone does not change EMI', () => {
    const base = computeResult(weakInputs)
    const nmiOnly = computeResult({ ...weakInputs, nmi: weakInputs.nmi * 3 })
    expect(nmiOnly.emi).toBeCloseTo(base.emi, 6)
    expect(nmiOnly.ltvPercent).toBeCloseTo(base.ltvPercent, 6)
  })

  it('changing Tenure alone does not change LTV or the Loan-Amount band score', () => {
    const base = computeResult(weakInputs)
    const tenureOnly = computeResult({ ...weakInputs, tenure: 48 })
    expect(tenureOnly.ltvPercent).toBeCloseTo(base.ltvPercent, 6)
    const loanAmountCategoryBefore = base.breakdown.categories.find((c) => c.key === 'loanAmount')!.achieved
    const loanAmountCategoryAfter = tenureOnly.breakdown.categories.find((c) => c.key === 'loanAmount')!.achieved
    expect(loanAmountCategoryAfter).toBe(loanAmountCategoryBefore)
  })

  it('changing Loan Amount moves LTV, EMI/NMI, and the Loan-Amount band together', () => {
    const base = computeResult(weakInputs)
    const lowerLoan = computeResult({ ...weakInputs, loanAmount: 5 * LAKH })
    expect(lowerLoan.ltvPercent).toBeLessThan(base.ltvPercent)
    expect(lowerLoan.emi).toBeLessThan(base.emi)
    expect(lowerLoan.emiNmiPercent).toBeLessThan(base.emiNmiPercent)
    const loanCatBefore = base.breakdown.categories.find((c) => c.key === 'loanAmount')!.achieved
    const loanCatAfter = lowerLoan.breakdown.categories.find((c) => c.key === 'loanAmount')!.achieved
    expect(loanCatAfter).not.toBe(loanCatBefore)
  })

  it('returns an empty array gracefully when no bounded combination reaches the threshold', () => {
    const hopeless: LoanInputs = {
      ...weakInputs,
      cibilScore: 600,
      isNtc: false,
      employment: 'BUSINESSMAN',
      hasCsp: false,
      age: 22,
      loanAmount: 19 * LAKH,
    }
    const base = computeResult(hopeless)
    expect(() =>
      findSuggestions(hopeless, base.valueOfCar, base.total, base.eligibility.eligible, APPROVAL_THRESHOLD),
    ).not.toThrow()
    const suggestions = findSuggestions(
      hopeless,
      base.valueOfCar,
      base.total,
      base.eligibility.eligible,
      APPROVAL_THRESHOLD,
    )
    expect(Array.isArray(suggestions)).toBe(true)
  })
})
