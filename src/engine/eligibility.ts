import {
  AGE_ELIGIBLE_MAX,
  AGE_ELIGIBLE_MIN,
  ANNUAL_INCOME_BRACKET_10L,
  ANNUAL_INCOME_BRACKET_15L,
  ANNUAL_INCOME_BRACKET_5L,
  CIBIL_MIN_DEFAULT,
  CIBIL_MIN_GOVT_EMPLOYEE_WITH_CSP,
  EMI_NMI_CAP_5L_TO_10L,
  EMI_NMI_CAP_ABOVE_10L_DEFAULT,
  EMI_NMI_CAP_CIBIL_BONUS_MIN,
  EMI_NMI_CAP_SALARIED_10L_TO_15L,
  EMI_NMI_CAP_SALARIED_ABOVE_15L,
  EMI_NMI_CAP_UPTO_5L,
  LOAN_AMOUNT_ABS_MIN,
  LOAN_MULTIPLE_AGRICULTURIST,
  LOAN_MULTIPLE_DEFAULT,
  MAX_LTV_FOR_ELIGIBILITY,
  MAX_MATURITY_AGE,
  NMI_MIN_AGRICULTURIST,
  NMI_MIN_DEFAULT,
  TENURE_ELIGIBLE_MAX_MONTHS,
  TENURE_ELIGIBLE_MIN_MONTHS,
} from './constants'
import type { EligibilityResult, EmploymentType, LoanInputs } from './types'

export const isAgriculturist = (employment: EmploymentType): boolean => employment === 'AGRICULTURIST'

export const isSalaried = (employment: EmploymentType): boolean =>
  employment === 'GOVERNMENT_EMPLOYEE' || employment === 'PVT_SECTOR_SALARIED'

export function getCibilMinimum(employment: EmploymentType, hasCsp: boolean): number {
  return employment === 'GOVERNMENT_EMPLOYEE' && hasCsp ? CIBIL_MIN_GOVT_EMPLOYEE_WITH_CSP : CIBIL_MIN_DEFAULT
}

export function getLoanMultipleCap(employment: EmploymentType): number {
  return isAgriculturist(employment) ? LOAN_MULTIPLE_AGRICULTURIST : LOAN_MULTIPLE_DEFAULT
}

export function getNmiMinimum(employment: EmploymentType): number {
  return isAgriculturist(employment) ? NMI_MIN_AGRICULTURIST : NMI_MIN_DEFAULT
}

/** Tenure must mature by MAX_MATURITY_AGE, on top of the flat eligible range. */
export function getMaxTenureMonths(age: number): number {
  return Math.min(TENURE_ELIGIBLE_MAX_MONTHS, (MAX_MATURITY_AGE - age) * 12)
}

/** EMI/NMI ratio cap (percent), based on net annual income and, above 10L, employment + CIBIL. */
export function getEmiNmiCap(nmi: number, employment: EmploymentType, cibilScore: number, isNtc: boolean): number {
  const annualIncome = nmi * 12
  if (annualIncome <= ANNUAL_INCOME_BRACKET_5L) return EMI_NMI_CAP_UPTO_5L
  if (annualIncome <= ANNUAL_INCOME_BRACKET_10L) return EMI_NMI_CAP_5L_TO_10L

  const qualifiesForBonus = isSalaried(employment) && !isNtc && cibilScore >= EMI_NMI_CAP_CIBIL_BONUS_MIN
  if (qualifiesForBonus) {
    return annualIncome <= ANNUAL_INCOME_BRACKET_15L ? EMI_NMI_CAP_SALARIED_10L_TO_15L : EMI_NMI_CAP_SALARIED_ABOVE_15L
  }
  return EMI_NMI_CAP_ABOVE_10L_DEFAULT
}

interface DerivedForEligibility {
  valueOfCar: number
  ltvPercent: number
  emiNmiPercent: number
}

export function checkEligibility(inputs: LoanInputs, derived: DerivedForEligibility): EligibilityResult {
  const reasons: string[] = []

  if (inputs.age < AGE_ELIGIBLE_MIN || inputs.age > AGE_ELIGIBLE_MAX) {
    reasons.push(`Age must be between ${AGE_ELIGIBLE_MIN} and ${AGE_ELIGIBLE_MAX} years`)
  }

  if (derived.ltvPercent > MAX_LTV_FOR_ELIGIBILITY) {
    reasons.push(`Loan Amount cannot exceed ${MAX_LTV_FOR_ELIGIBILITY}% of Value of Car (currently ${derived.ltvPercent.toFixed(1)}%)`)
  }

  if (inputs.loanAmount < LOAN_AMOUNT_ABS_MIN) {
    reasons.push(`Loan Amount must be at least Rs. ${LOAN_AMOUNT_ABS_MIN.toLocaleString('en-IN')}`)
  }

  const loanMultipleCap = getLoanMultipleCap(inputs.employment)
  const maxLoanByNmi = inputs.nmi * loanMultipleCap
  if (inputs.loanAmount > maxLoanByNmi) {
    reasons.push(
      `Loan Amount cannot exceed ${loanMultipleCap}x Net Monthly Income (max Rs. ${Math.round(maxLoanByNmi).toLocaleString('en-IN')})`,
    )
  }

  if (!inputs.isNtc) {
    const cibilMinimum = getCibilMinimum(inputs.employment, inputs.hasCsp)
    if (inputs.cibilScore < cibilMinimum) {
      reasons.push(`CIBIL Score must be at least ${cibilMinimum} for this applicant category`)
    }
  }

  if (inputs.tenure < TENURE_ELIGIBLE_MIN_MONTHS) {
    reasons.push(`Tenure must be at least ${TENURE_ELIGIBLE_MIN_MONTHS} months`)
  }
  const maxTenure = getMaxTenureMonths(inputs.age)
  if (maxTenure <= 0) {
    reasons.push(`Applicant's age already exceeds the maximum loan maturity age of ${MAX_MATURITY_AGE}`)
  } else if (inputs.tenure > maxTenure) {
    reasons.push(
      maxTenure < TENURE_ELIGIBLE_MAX_MONTHS
        ? `Tenure cannot exceed ${maxTenure} months (loan must mature by age ${MAX_MATURITY_AGE})`
        : `Tenure cannot exceed ${TENURE_ELIGIBLE_MAX_MONTHS} months`,
    )
  }

  const nmiMinimum = getNmiMinimum(inputs.employment)
  if (inputs.nmi < nmiMinimum) {
    reasons.push(`Net Monthly Income must be at least Rs. ${nmiMinimum.toLocaleString('en-IN')} for this applicant category`)
  }

  const emiNmiCap = getEmiNmiCap(inputs.nmi, inputs.employment, inputs.cibilScore, inputs.isNtc)
  if (derived.emiNmiPercent > emiNmiCap) {
    reasons.push(`EMI/NMI ratio cannot exceed ${emiNmiCap}% for this income bracket (currently ${derived.emiNmiPercent.toFixed(1)}%)`)
  }

  return { eligible: reasons.length === 0, reasons }
}
