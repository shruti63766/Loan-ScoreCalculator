import { calculateEMI } from '../emi'
import { computeResult } from '../scoring'
import type { LoanInputs, Suggestion } from '../types'
import { generateLoanAmountCandidates, generateNmiCandidates, generateTenureCandidates } from './candidates'

const MAX_SUGGESTIONS = 3

function computeMagnitude(
  original: Pick<LoanInputs, 'loanAmount' | 'tenure' | 'nmi'>,
  candidate: Pick<LoanInputs, 'loanAmount' | 'tenure' | 'nmi'>,
): number {
  const loanDelta = Math.abs(candidate.loanAmount - original.loanAmount) / original.loanAmount
  const tenureDelta = Math.abs(candidate.tenure - original.tenure) / original.tenure
  const nmiDelta = original.nmi > 0 ? Math.abs(candidate.nmi - original.nmi) / original.nmi : 0
  return loanDelta + tenureDelta + nmiDelta
}

function rankSuggestions(suggestions: Suggestion[]): Suggestion[] {
  return [...suggestions].sort((a, b) =>
    a.leverCount !== b.leverCount ? a.leverCount - b.leverCount : a.magnitude - b.magnitude,
  )
}

/** Tests bounded combinations of Loan Amount / Tenure / NMI (each clamped to its eligibility
 * range) and returns the simplest ones that are both eligible and cross the approval threshold,
 * each carrying a fully recalculated result. */
export function findSuggestions(
  inputs: LoanInputs,
  valueOfCar: number,
  baselineTotal: number,
  baselineEligible: boolean,
  approvalThreshold: number,
): Suggestion[] {
  if (baselineEligible && baselineTotal >= approvalThreshold) return []

  const loanCandidates = generateLoanAmountCandidates(inputs.loanAmount, valueOfCar, inputs.nmi, inputs.employment)
  const tenureCandidates = generateTenureCandidates(inputs.tenure, inputs.age)
  const found: Suggestion[] = []

  for (const loanAmount of loanCandidates) {
    for (const tenure of tenureCandidates) {
      const emi = calculateEMI(loanAmount, inputs.rateOfInterest, tenure)
      const nmiCandidates = generateNmiCandidates(emi, inputs.nmi, inputs.employment)

      for (const nmi of nmiCandidates) {
        const isNoChange = loanAmount === inputs.loanAmount && tenure === inputs.tenure && nmi === inputs.nmi
        if (isNoChange) continue

        const result = computeResult({ ...inputs, loanAmount, tenure, nmi })
        if (!result.eligibility.eligible || result.total < approvalThreshold) continue

        const leverCount = [
          loanAmount !== inputs.loanAmount,
          tenure !== inputs.tenure,
          nmi !== inputs.nmi,
        ].filter(Boolean).length

        found.push({
          loanAmount,
          tenure,
          nmi,
          leverCount,
          magnitude: computeMagnitude(inputs, { loanAmount, tenure, nmi }),
          result,
        })
      }
    }
  }

  return rankSuggestions(found).slice(0, MAX_SUGGESTIONS)
}
