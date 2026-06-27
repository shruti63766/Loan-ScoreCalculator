import {
  EMI_NMI_TARGET_RATIOS,
  LOAN_AMOUNT_ABS_MIN,
  LOAN_AMOUNT_BOUNDARIES,
  MAX_LTV_FOR_ELIGIBILITY,
  TENURE_BOUNDARIES,
  TENURE_ELIGIBLE_MIN_MONTHS,
} from '../constants'
import { getLoanMultipleCap, getMaxTenureMonths, getNmiMinimum } from '../eligibility'
import type { EmploymentType } from '../types'

const roundDownToNearest1000 = (v: number): number => Math.floor(v / 1000) * 1000
const roundUpToNearest100 = (v: number): number => Math.ceil(v / 100) * 100

/** Loan Amount only ever moves down. Tests "just inside" every band boundary below the current
 * value, clamped to the eligible range (>= abs min, <= 90% LTV, <= NMI multiple cap). */
export function generateLoanAmountCandidates(
  currentLoanAmount: number,
  valueOfCar: number,
  nmi: number,
  employment: EmploymentType,
): number[] {
  const eligibleMax = Math.min(
    (valueOfCar * MAX_LTV_FOR_ELIGIBILITY) / 100,
    nmi * getLoanMultipleCap(employment),
  )

  const candidates = new Set<number>([currentLoanAmount])
  for (const boundary of LOAN_AMOUNT_BOUNDARIES) {
    if (boundary < currentLoanAmount) {
      candidates.add(roundDownToNearest1000(boundary - 1))
    }
  }
  // If the current amount itself breaches the LTV/NMI-multiple cap, also test right at that cap.
  if (currentLoanAmount > eligibleMax) {
    candidates.add(roundDownToNearest1000(eligibleMax))
  }

  return Array.from(candidates).filter((v) => v >= LOAN_AMOUNT_ABS_MIN && v <= eligibleMax)
}

/** Tenure can move either direction — shortening improves the Tenure score but raises EMI;
 * lengthening does the opposite. Test just inside every fixed band boundary both ways,
 * clamped to [36 months, min(84 months, age-adjusted maturity cap)]. */
export function generateTenureCandidates(currentTenure: number, age: number): number[] {
  const max = getMaxTenureMonths(age)
  const min = TENURE_ELIGIBLE_MIN_MONTHS

  const candidates = new Set<number>([currentTenure])
  for (const boundary of TENURE_BOUNDARIES) {
    candidates.add(boundary)
    candidates.add(boundary - 1)
  }
  candidates.add(min)
  candidates.add(max)

  return Array.from(candidates).filter((v) => v >= min && v <= max)
}

/** Solves backwards for the minimum NMI that would reach a better EMI/NMI band, given a
 * specific EMI (which itself depends on the Loan Amount/Tenure candidate being evaluated).
 * Also includes the category's eligibility-minimum NMI as a candidate. */
export function generateNmiCandidates(emi: number, currentNmi: number, employment: EmploymentType): number[] {
  const candidates = new Set<number>([currentNmi])

  const nmiMinimum = getNmiMinimum(employment)
  if (nmiMinimum > currentNmi) candidates.add(nmiMinimum)

  for (const targetRatioPercent of EMI_NMI_TARGET_RATIOS) {
    const requiredNmi = emi / (targetRatioPercent / 100)
    if (requiredNmi > currentNmi) {
      candidates.add(roundUpToNearest100(requiredNmi))
    }
  }
  return Array.from(candidates).filter((v) => v > 0)
}
