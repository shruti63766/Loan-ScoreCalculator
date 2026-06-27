import type { EmploymentType } from './types'

export const APPROVAL_THRESHOLD = 41

export interface Band<T> {
  label: string
  test: (value: T) => boolean
  score: number
}

export const CIBIL_MIN = 5
export const CIBIL_MAX = 20
export const CIBIL_NTC_SCORE = 12
export const CIBIL_BELOW_650_SCORE = 0

export const CIBIL_BANDS: Band<number>[] = [
  { label: '650-710', test: (v) => v >= 650 && v <= 710, score: 5 },
  { label: '711-730', test: (v) => v >= 711 && v <= 730, score: 8 },
  { label: '731-750', test: (v) => v >= 731 && v <= 750, score: 12 },
  { label: '751-770', test: (v) => v >= 751 && v <= 770, score: 15 },
  { label: '771-800', test: (v) => v >= 771 && v <= 800, score: 18 },
  { label: '>=801', test: (v) => v >= 801, score: 20 },
]

export const EMPLOYMENT_MIN = 2
export const EMPLOYMENT_MAX = 18
export const EMPLOYMENT_SCORES: Record<EmploymentType, { score: number; label: string }> = {
  GOVERNMENT_EMPLOYEE: { score: 18, label: 'Government Employee' },
  PENSIONER: { score: 18, label: 'Pensioner' },
  PVT_SECTOR_SALARIED: { score: 15, label: 'Pvt Sector Salaried' },
  PROFESSIONAL: { score: 10, label: 'Professional' },
  OTHERS: { score: 5, label: 'Others' },
  AGRICULTURIST: { score: 5, label: 'Agriculturist' },
  BUSINESSMAN: { score: 2, label: 'Businessman' },
}

export const LTV_MIN = 5
export const LTV_MAX = 18
export const LTV_BANDS: Band<number>[] = [
  { label: '<30%', test: (v) => v < 30, score: 18 },
  { label: '30% - <60%', test: (v) => v >= 30 && v < 60, score: 15 },
  { label: '60% - <80%', test: (v) => v >= 60 && v < 80, score: 10 },
  { label: '>=80%', test: (v) => v >= 80, score: 5 },
]
/** Fixed LTV-band boundaries, descending, used by the suggestion search. */
export const LTV_BOUNDARIES = [80, 60, 30]

export const TENURE_MIN = 5
export const TENURE_MAX = 15
export const TENURE_BANDS: Band<number>[] = [
  { label: '<60 months', test: (v) => v < 60, score: 15 },
  { label: '60 - <72 months', test: (v) => v >= 60 && v < 72, score: 12 },
  { label: '72 - 78 months', test: (v) => v >= 72 && v <= 78, score: 10 },
  { label: '>78 months', test: (v) => v > 78, score: 5 },
]
/** Fixed Tenure-band boundaries (months), used by the suggestion search. */
export const TENURE_BOUNDARIES = [60, 72, 78]

export const EMI_NMI_MIN = 4
export const EMI_NMI_MAX = 12
export const EMI_NMI_BANDS: Band<number>[] = [
  { label: '<=15%', test: (v) => v <= 15, score: 12 },
  { label: '15% - 30%', test: (v) => v > 15 && v <= 30, score: 8 },
  { label: '>30%', test: (v) => v > 30, score: 4 },
]
/** Upper-bound percentages of the two better EMI/NMI bands, used to solve for required NMI. */
export const EMI_NMI_TARGET_RATIOS = [15, 30]

export const CSP_MIN = 0
export const CSP_MAX = 7
export const CSP_SCORES = { YES: 7, NO: 0 } as const

export const AGE_MIN = 1
export const AGE_MAX = 5
export const AGE_BANDS: Band<number>[] = [
  { label: '<25', test: (v) => v < 25, score: 1 },
  { label: '25 - <40', test: (v) => v >= 25 && v < 40, score: 4 },
  { label: '>=40', test: (v) => v >= 40, score: 5 },
]

export const LOAN_AMOUNT_MIN = 1
export const LOAN_AMOUNT_MAX = 5
export const LAKH = 100_000
export const LOAN_AMOUNT_BANDS: Band<number>[] = [
  { label: '<4L', test: (v) => v < 4 * LAKH, score: 5 },
  { label: '4L - <7.5L', test: (v) => v >= 4 * LAKH && v < 7.5 * LAKH, score: 4 },
  { label: '7.5L - <9.5L', test: (v) => v >= 7.5 * LAKH && v < 9.5 * LAKH, score: 3 },
  { label: '9.5L - <16L', test: (v) => v >= 9.5 * LAKH && v < 16 * LAKH, score: 2 },
  { label: '16L - <18L', test: (v) => v >= 16 * LAKH && v < 18 * LAKH, score: 1 },
  // Intentional per Annexure-I as printed: >=18L jumps back up to 4. Confirmed with
  // stakeholder this is not a typo — do not "fix" to continue the descending pattern.
  { label: '>=18L', test: (v) => v >= 18 * LAKH, score: 4 },
]
/** Fixed Loan-Amount-band boundaries (rupees), descending, used by the suggestion search. */
export const LOAN_AMOUNT_BOUNDARIES = [18 * LAKH, 16 * LAKH, 9.5 * LAKH, 7.5 * LAKH, 4 * LAKH]

export function resolveBand<T>(bands: Band<T>[], value: T): Band<T> {
  const match = bands.find((b) => b.test(value))
  if (!match) {
    throw new Error(`No band matched value ${String(value)} — check band coverage`)
  }
  return match
}

// --- Eligibility gates (hard pass/fail policy rules, distinct from the scorecard above) ---

export const AGE_ELIGIBLE_MIN = 21
export const AGE_ELIGIBLE_MAX = 70

export const MAX_LTV_FOR_ELIGIBILITY = 90 // percent

export const LOAN_AMOUNT_ABS_MIN = 1 * LAKH
export const LOAN_MULTIPLE_AGRICULTURIST = 36 // x NMI
export const LOAN_MULTIPLE_DEFAULT = 48 // x NMI

export const CIBIL_MIN_GOVT_EMPLOYEE_WITH_CSP = 650
export const CIBIL_MIN_DEFAULT = 700

export const TENURE_ELIGIBLE_MIN_MONTHS = 36
export const TENURE_ELIGIBLE_MAX_MONTHS = 84
/** Loan must mature (Age + Tenure) by this age. */
export const MAX_MATURITY_AGE = 75

export const NMI_MIN_AGRICULTURIST = 30_000
export const NMI_MIN_DEFAULT = 25_000

/** EMI/NMI ratio cap (percent), based on net annual income (NMI x 12). */
export const EMI_NMI_CAP_UPTO_5L = 50
export const EMI_NMI_CAP_5L_TO_10L = 60
export const EMI_NMI_CAP_ABOVE_10L_DEFAULT = 65
/** Bonus caps for Salaried (Government Employee or Pvt Sector Salaried) applicants
 * with CIBIL >= EMI_NMI_CAP_CIBIL_BONUS_MIN, which override the default above 10L. */
export const EMI_NMI_CAP_SALARIED_10L_TO_15L = 70
export const EMI_NMI_CAP_SALARIED_ABOVE_15L = 75
export const EMI_NMI_CAP_CIBIL_BONUS_MIN = 700

export const ANNUAL_INCOME_BRACKET_5L = 5 * LAKH
export const ANNUAL_INCOME_BRACKET_10L = 10 * LAKH
export const ANNUAL_INCOME_BRACKET_15L = 15 * LAKH
