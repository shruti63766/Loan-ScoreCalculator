import { APPROVAL_THRESHOLD } from './constants'
import { computeResult as computeBaseResult } from './scoring'
import { findSuggestions } from './suggestions/search'
import type { LoanInputs, LoanResult } from './types'

/** The one entry point the UI should call: inputs -> full result, including ranked suggestions. */
export function computeResult(inputs: LoanInputs): LoanResult {
  const base = computeBaseResult(inputs)
  const suggestions = findSuggestions(inputs, base.valueOfCar, base.total, base.eligibility.eligible, APPROVAL_THRESHOLD)
  return { ...base, suggestions }
}

export {
  AGE_ELIGIBLE_MAX,
  AGE_ELIGIBLE_MIN,
  APPROVAL_THRESHOLD,
  EMPLOYMENT_SCORES,
  LOAN_AMOUNT_ABS_MIN,
  MAX_LTV_FOR_ELIGIBILITY,
  TENURE_ELIGIBLE_MAX_MONTHS,
  TENURE_ELIGIBLE_MIN_MONTHS,
} from './constants'
export { SCORECARD_REFERENCE } from './referenceTable'
export type { ReferenceCategory, ReferenceRow } from './referenceTable'
export {
  getCibilMinimum,
  getEmiNmiCap,
  getLoanMultipleCap,
  getMaxTenureMonths,
  getNmiMinimum,
  isAgriculturist,
  isSalaried,
} from './eligibility'
export type {
  CategoryKey,
  CategoryResult,
  EligibilityResult,
  EmploymentType,
  LoanInputs,
  LoanResult,
  Suggestion,
} from './types'
