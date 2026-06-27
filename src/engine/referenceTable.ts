import {
  AGE_BANDS,
  AGE_MAX,
  AGE_MIN,
  CIBIL_BANDS,
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
} from './constants'
import type { CategoryKey } from './types'

export interface ReferenceRow {
  label: string
  score: number
}

export interface ReferenceCategory {
  key: CategoryKey
  title: string
  max: number
  min: number
  rows: ReferenceRow[]
}

/** Mirrors Annexure-I exactly, derived from the same band constants the engine scores against. */
export const SCORECARD_REFERENCE: ReferenceCategory[] = [
  {
    key: 'cibil',
    title: 'CIC Score',
    max: CIBIL_MAX,
    min: CIBIL_MIN,
    rows: [...CIBIL_BANDS.map((b) => ({ label: b.label, score: b.score })), { label: 'NTC', score: CIBIL_NTC_SCORE }],
  },
  {
    key: 'employment',
    title: 'Employment Detail',
    max: EMPLOYMENT_MAX,
    min: EMPLOYMENT_MIN,
    rows: Object.values(EMPLOYMENT_SCORES).map((e) => ({ label: e.label, score: e.score })),
  },
  {
    key: 'ltv',
    title: 'LTV (%)',
    max: LTV_MAX,
    min: LTV_MIN,
    rows: LTV_BANDS.map((b) => ({ label: b.label, score: b.score })),
  },
  {
    key: 'tenure',
    title: 'Tenure',
    max: TENURE_MAX,
    min: TENURE_MIN,
    rows: TENURE_BANDS.map((b) => ({ label: b.label, score: b.score })),
  },
  {
    key: 'emiNmi',
    title: 'EMI NMI Ratio (%)',
    max: EMI_NMI_MAX,
    min: EMI_NMI_MIN,
    rows: EMI_NMI_BANDS.map((b) => ({ label: b.label, score: b.score })),
  },
  {
    key: 'csp',
    title: 'CSP (Salary Package) with Bank',
    max: CSP_MAX,
    min: CSP_MIN,
    rows: [
      { label: 'Yes', score: CSP_SCORES.YES },
      { label: 'No', score: CSP_SCORES.NO },
    ],
  },
  {
    key: 'age',
    title: 'Age (in years)',
    max: AGE_MAX,
    min: AGE_MIN,
    rows: AGE_BANDS.map((b) => ({ label: b.label, score: b.score })),
  },
  {
    key: 'loanAmount',
    title: 'Loan Amount (in Rs. Lakh)',
    max: LOAN_AMOUNT_MAX,
    min: LOAN_AMOUNT_MIN,
    rows: LOAN_AMOUNT_BANDS.map((b) => ({ label: b.label, score: b.score })),
  },
]
