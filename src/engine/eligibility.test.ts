import { describe, expect, it } from 'vitest'
import { LAKH } from './constants'
import { calculateEmiNmiRatio, calculateLTV, calculateValueOfCar } from './derived'
import { calculateEMI } from './emi'
import {
  checkEligibility,
  getCibilMinimum,
  getEmiNmiCap,
  getLoanMultipleCap,
  getMaxTenureMonths,
  getNmiMinimum,
  isAgriculturist,
  isSalaried,
} from './eligibility'
import type { LoanInputs } from './types'

const compliant: LoanInputs = {
  cibilScore: 750,
  isNtc: false,
  employment: 'PVT_SECTOR_SALARIED',
  exShowroomPrice: 700_000,
  registrationCharge: 30_000,
  insurance: 20_000,
  loanAmount: 500_000,
  tenure: 60,
  nmi: 30_000,
  rateOfInterest: 9,
  hasCsp: true,
  age: 35,
}

function evaluate(inputs: LoanInputs) {
  const valueOfCar = calculateValueOfCar(inputs.exShowroomPrice, inputs.registrationCharge, inputs.insurance)
  const emi = calculateEMI(inputs.loanAmount, inputs.rateOfInterest, inputs.tenure)
  const ltvPercent = calculateLTV(inputs.loanAmount, valueOfCar)
  const emiNmiPercent = calculateEmiNmiRatio(emi, inputs.nmi)
  return checkEligibility(inputs, { valueOfCar, ltvPercent, emiNmiPercent })
}

describe('checkEligibility', () => {
  it('a fully compliant applicant is eligible with no reasons', () => {
    const result = evaluate(compliant)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  describe('age', () => {
    it.each([
      [20, false],
      [21, true],
      [70, true],
      [71, false],
    ])('age=%i -> eligible=%s', (age, expectedEligible) => {
      // Tenure 36 satisfies the maturity cap at every tested age; higher NMI keeps the
      // EMI/NMI ratio under its cap at that short a tenure (which maximizes EMI).
      const result = evaluate({ ...compliant, age, tenure: 36, nmi: 100_000 })
      expect(result.eligible).toBe(expectedEligible)
    })
  })

  describe('LTV cap', () => {
    it('90% exactly is eligible, just above is not', () => {
      const valueOfCar = 1_000_000
      const atCap = evaluate({
        ...compliant,
        exShowroomPrice: valueOfCar - 50_000,
        registrationCharge: 30_000,
        insurance: 20_000,
        loanAmount: 900_000,
        nmi: 100_000, // generous enough to not also trip the loan-multiple cap
      })
      expect(atCap.eligible).toBe(true)

      const overCap = evaluate({
        ...compliant,
        exShowroomPrice: valueOfCar - 50_000,
        registrationCharge: 30_000,
        insurance: 20_000,
        loanAmount: 900_001,
        nmi: 100_000,
      })
      expect(overCap.eligible).toBe(false)
      expect(overCap.reasons.some((r) => r.includes('90%'))).toBe(true)
    })
  })

  describe('loan amount bounds', () => {
    it('below the absolute minimum is ineligible', () => {
      const result = evaluate({ ...compliant, loanAmount: 99_999 })
      expect(result.eligible).toBe(false)
      expect(result.reasons.some((r) => r.includes('at least Rs. 1,00,000'))).toBe(true)
    })

    it('at the absolute minimum is eligible', () => {
      const result = evaluate({ ...compliant, loanAmount: 1 * LAKH })
      expect(result.eligible).toBe(true)
    })

    it('Agriculturist is capped at 36x NMI, others at 48x', () => {
      // Low rate + long tenure keeps the EMI/NMI ratio comfortably under its own cap, so this
      // isolates the loan-multiple gate specifically rather than confounding it with that one.
      const nmi = 30_000
      const shared = { nmi, loanAmount: 36 * nmi + 1, exShowroomPrice: 2_000_000, tenure: 84, rateOfInterest: 1 }

      const agriculturist = evaluate({ ...compliant, ...shared, employment: 'AGRICULTURIST' })
      expect(agriculturist.eligible).toBe(false)
      expect(agriculturist.reasons.some((r) => r.includes('36x'))).toBe(true)

      const others = evaluate({ ...compliant, ...shared, employment: 'PROFESSIONAL' })
      expect(others.eligible).toBe(true) // within the more generous 48x cap
    })
  })

  describe('CIBIL minimum', () => {
    it('Government Employee with CSP only needs 650', () => {
      const result = evaluate({ ...compliant, employment: 'GOVERNMENT_EMPLOYEE', hasCsp: true, cibilScore: 660 })
      expect(result.eligible).toBe(true)
    })

    it('Government Employee without CSP needs 700', () => {
      const result = evaluate({ ...compliant, employment: 'GOVERNMENT_EMPLOYEE', hasCsp: false, cibilScore: 660 })
      expect(result.eligible).toBe(false)
    })

    it('Pensioner with CSP still needs 700 (exception does not extend to Pensioners)', () => {
      const result = evaluate({ ...compliant, employment: 'PENSIONER', hasCsp: true, cibilScore: 660 })
      expect(result.eligible).toBe(false)
    })

    it('everyone else needs 700 regardless of CSP', () => {
      const result = evaluate({ ...compliant, employment: 'PVT_SECTOR_SALARIED', hasCsp: true, cibilScore: 699 })
      expect(result.eligible).toBe(false)
    })

    it('NTC applicants bypass the CIBIL minimum entirely', () => {
      const result = evaluate({ ...compliant, employment: 'PVT_SECTOR_SALARIED', isNtc: true, cibilScore: 0 })
      expect(result.eligible).toBe(true)
    })
  })

  describe('tenure bounds', () => {
    it.each([
      [35, false],
      [36, true],
      [84, true],
      [85, false],
    ])('tenure=%i months -> eligible=%s', (tenure, expectedEligible) => {
      // Higher NMI than the shared fixture keeps the EMI/NMI ratio under its cap even at the
      // shortest tested tenure (which maximizes EMI), so this isolates the tenure gate alone.
      const result = evaluate({ ...compliant, tenure, age: 30, nmi: 100_000 })
      expect(result.eligible).toBe(expectedEligible)
    })

    it('caps tenure further when the loan would mature past age 75', () => {
      // Age 70 -> max maturity-based tenure is (75-70)*12 = 60 months, tighter than the flat 84.
      const withinAgeCap = evaluate({ ...compliant, age: 70, tenure: 60 })
      expect(withinAgeCap.eligible).toBe(true)

      const overAgeCap = evaluate({ ...compliant, age: 70, tenure: 61 })
      expect(overAgeCap.eligible).toBe(false)
      expect(overAgeCap.reasons.some((r) => r.includes('mature by age 75'))).toBe(true)
    })
  })

  describe('NMI minimum', () => {
    it('Agriculturist needs at least 30,000', () => {
      const result = evaluate({ ...compliant, employment: 'AGRICULTURIST', nmi: 29_999, loanAmount: 1 * LAKH })
      expect(result.eligible).toBe(false)
    })

    it('everyone else needs at least 25,000', () => {
      const result = evaluate({ ...compliant, employment: 'OTHERS', nmi: 24_999, loanAmount: 1 * LAKH })
      expect(result.eligible).toBe(false)
    })
  })

  describe('EMI/NMI ratio cap', () => {
    it('is never violated for a modest EMI relative to a generous cap', () => {
      const result = evaluate(compliant)
      expect(result.eligible).toBe(true)
    })

    it('flags a ratio above the applicable cap for a low-income bracket', () => {
      // Annual income stays 3.6L (<=5L bracket -> 50% cap); loan amount/tenure/car value are
      // chosen so only the EMI/NMI ratio breaches its cap, not LTV or the loan-multiple cap.
      const result = evaluate({
        ...compliant,
        loanAmount: 1_000_000,
        tenure: 36,
        exShowroomPrice: 1_150_000,
      })
      expect(result.eligible).toBe(false)
      expect(result.reasons.some((r) => r.includes('EMI/NMI ratio cannot exceed'))).toBe(true)
    })
  })

  it('collects multiple independent reasons at once', () => {
    const result = evaluate({ ...compliant, age: 80, tenure: 10, nmi: 1000, loanAmount: 50 })
    expect(result.eligible).toBe(false)
    expect(result.reasons.length).toBeGreaterThan(1)
  })
})

describe('eligibility helper functions', () => {
  it('isAgriculturist / isSalaried classify employment types correctly', () => {
    expect(isAgriculturist('AGRICULTURIST')).toBe(true)
    expect(isAgriculturist('OTHERS')).toBe(false)
    expect(isSalaried('GOVERNMENT_EMPLOYEE')).toBe(true)
    expect(isSalaried('PVT_SECTOR_SALARIED')).toBe(true)
    expect(isSalaried('PENSIONER')).toBe(false)
    expect(isSalaried('BUSINESSMAN')).toBe(false)
  })

  it('getCibilMinimum', () => {
    expect(getCibilMinimum('GOVERNMENT_EMPLOYEE', true)).toBe(650)
    expect(getCibilMinimum('GOVERNMENT_EMPLOYEE', false)).toBe(700)
    expect(getCibilMinimum('PENSIONER', true)).toBe(700)
    expect(getCibilMinimum('PROFESSIONAL', true)).toBe(700)
  })

  it('getLoanMultipleCap', () => {
    expect(getLoanMultipleCap('AGRICULTURIST')).toBe(36)
    expect(getLoanMultipleCap('PVT_SECTOR_SALARIED')).toBe(48)
  })

  it('getNmiMinimum', () => {
    expect(getNmiMinimum('AGRICULTURIST')).toBe(30_000)
    expect(getNmiMinimum('PROFESSIONAL')).toBe(25_000)
  })

  it('getMaxTenureMonths', () => {
    expect(getMaxTenureMonths(30)).toBe(84) // flat cap binds
    expect(getMaxTenureMonths(70)).toBe(60) // (75-70)*12 binds instead
    expect(getMaxTenureMonths(73)).toBe(24)
  })

  it('getEmiNmiCap brackets', () => {
    expect(getEmiNmiCap(40_000, 'PROFESSIONAL', 750, false)).toBe(50) // 4.8L/yr <= 5L
    expect(getEmiNmiCap(70_000, 'PROFESSIONAL', 750, false)).toBe(60) // 8.4L/yr, 5-10L
    expect(getEmiNmiCap(100_000, 'PROFESSIONAL', 750, false)).toBe(65) // 12L/yr, non-salaried default
    expect(getEmiNmiCap(100_000, 'PVT_SECTOR_SALARIED', 700, false)).toBe(70) // 12L/yr, salaried + CIC>=700
    expect(getEmiNmiCap(100_000, 'PVT_SECTOR_SALARIED', 699, false)).toBe(65) // CIC just under the bonus bar
    expect(getEmiNmiCap(140_000, 'GOVERNMENT_EMPLOYEE', 700, false)).toBe(75) // 16.8L/yr, salaried + CIC>=700
    expect(getEmiNmiCap(140_000, 'BUSINESSMAN', 750, false)).toBe(65) // not salaried, default even though high income
    expect(getEmiNmiCap(140_000, 'PVT_SECTOR_SALARIED', 750, true)).toBe(65) // NTC can't satisfy the CIC bonus
  })
})
