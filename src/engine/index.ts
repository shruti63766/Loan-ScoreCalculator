import { APPROVAL_THRESHOLD } from './constants'
import { computeResult as computeBaseResult } from './scoring'
import { findSuggestions } from './suggestions/search'
import type { LoanInputs, LoanResult } from './types'

/** The one entry point the UI should call: inputs -> full result, including ranked suggestions. */
export function computeResult(inputs: LoanInputs): LoanResult {
  const base = computeBaseResult(inputs)
  const suggestions = findSuggestions(inputs, base.total, APPROVAL_THRESHOLD)
  return { ...base, suggestions }
}

export { APPROVAL_THRESHOLD } from './constants'
export { EMPLOYMENT_SCORES } from './constants'
export type { CategoryKey, CategoryResult, EmploymentType, LoanInputs, LoanResult, Suggestion } from './types'
