import {
  AGE_BANDS,
  AGE_MAX,
  AGE_MIN,
  APPROVAL_THRESHOLD,
  CIBIL_BANDS,
  CIBIL_BELOW_650_SCORE,
  CIBIL_MAX,
  CIBIL_MIN,
  CIBIL_NTC_SCORE,
  CSP_MAX,
  CSP_MIN,
  CSP_SCORES,
  EMI_NMI_BANDS,
  EMI_NMI_MAX,
  EMI_NMI_MIN,
  EMPLOYMENT_MAX,
  EMPLOYMENT_MIN,
  EMPLOYMENT_SCORES,
  LOAN_AMOUNT_BANDS,
  LOAN_AMOUNT_MAX,
  LOAN_AMOUNT_MIN,
  LTV_BANDS,
  LTV_MAX,
  LTV_MIN,
  TENURE_BANDS,
  TENURE_MAX,
  TENURE_MIN,
  resolveBand,
} from './constants'
import { calculateEmiNmiRatio, calculateLTV, calculateValueOfCar } from './derived'
import { checkEligibility } from './eligibility'
import { calculateEMI } from './emi'
import type { CategoryResult, LoanInputs, LoanResult, ScoreBreakdown } from './types'

export function scoreCibil(cibilScore: number, isNtc: boolean): number {
  if (isNtc) return CIBIL_NTC_SCORE
  if (cibilScore < 650) return CIBIL_BELOW_650_SCORE
  return resolveBand(CIBIL_BANDS, cibilScore).score
}

export function computeScoreBreakdown(inputs: LoanInputs, ltvPercent: number, emiNmiPercent: number): ScoreBreakdown {
  const categories: CategoryResult[] = [
    {
      key: 'cibil',
      label: 'CIC Score (CIBIL)',
      achieved: scoreCibil(inputs.cibilScore, inputs.isNtc),
      min: CIBIL_MIN,
      max: CIBIL_MAX,
    },
    {
      key: 'employment',
      label: 'Employment Detail',
      achieved: EMPLOYMENT_SCORES[inputs.employment].score,
      min: EMPLOYMENT_MIN,
      max: EMPLOYMENT_MAX,
    },
    {
      key: 'ltv',
      label: 'LTV (%)',
      achieved: resolveBand(LTV_BANDS, ltvPercent).score,
      min: LTV_MIN,
      max: LTV_MAX,
    },
    {
      key: 'tenure',
      label: 'Tenure',
      achieved: resolveBand(TENURE_BANDS, inputs.tenure).score,
      min: TENURE_MIN,
      max: TENURE_MAX,
    },
    {
      key: 'emiNmi',
      label: 'EMI/NMI Ratio (%)',
      achieved: resolveBand(EMI_NMI_BANDS, emiNmiPercent).score,
      min: EMI_NMI_MIN,
      max: EMI_NMI_MAX,
    },
    {
      key: 'csp',
      label: 'CSP (Salary Package) with Bank',
      achieved: inputs.hasCsp ? CSP_SCORES.YES : CSP_SCORES.NO,
      min: CSP_MIN,
      max: CSP_MAX,
    },
    {
      key: 'age',
      label: 'Age (years)',
      achieved: resolveBand(AGE_BANDS, inputs.age).score,
      min: AGE_MIN,
      max: AGE_MAX,
    },
    {
      key: 'loanAmount',
      label: 'Loan Amount (Rs. Lakh)',
      achieved: resolveBand(LOAN_AMOUNT_BANDS, inputs.loanAmount).score,
      min: LOAN_AMOUNT_MIN,
      max: LOAN_AMOUNT_MAX,
    },
  ]

  const total = categories.reduce((sum, c) => sum + c.achieved, 0)
  return { categories, total }
}

/** The single pipeline inputs -> EMI -> derived % -> score breakdown + eligibility -> total. */
export function computeResult(inputs: LoanInputs): Omit<LoanResult, 'suggestions'> {
  const valueOfCar = calculateValueOfCar(inputs.exShowroomPrice, inputs.registrationCharge, inputs.insurance)
  const emi = calculateEMI(inputs.loanAmount, inputs.rateOfInterest, inputs.tenure)
  const ltvPercent = calculateLTV(inputs.loanAmount, valueOfCar)
  const emiNmiPercent = calculateEmiNmiRatio(emi, inputs.nmi)

  const breakdown = computeScoreBreakdown(inputs, ltvPercent, emiNmiPercent)
  const eligibility = checkEligibility(inputs, { valueOfCar, ltvPercent, emiNmiPercent })

  return {
    emi,
    valueOfCar,
    ltvPercent,
    emiNmiPercent,
    breakdown,
    total: breakdown.total,
    eligibility,
    approved: eligibility.eligible && breakdown.total >= APPROVAL_THRESHOLD,
  }
}
