export type EmploymentType =
  | 'GOVERNMENT_OR_PENSIONER'
  | 'PVT_SECTOR_SALARIED'
  | 'PROFESSIONAL'
  | 'OTHERS_INCL_AGRICULTURIST'
  | 'BUSINESSMAN'

export interface LoanInputs {
  /** CIBIL score, ignored when isNtc is true */
  cibilScore: number
  isNtc: boolean
  employment: EmploymentType
  exShowroomPrice: number
  registrationCharge: number
  insurance: number
  /** Principal requested, in rupees */
  loanAmount: number
  /** In months */
  tenure: number
  /** Net monthly income, in rupees */
  nmi: number
  /** Annual rate, percent */
  rateOfInterest: number
  hasCsp: boolean
  age: number
}

export type CategoryKey =
  | 'cibil'
  | 'employment'
  | 'ltv'
  | 'tenure'
  | 'emiNmi'
  | 'csp'
  | 'age'
  | 'loanAmount'

export interface CategoryResult {
  key: CategoryKey
  label: string
  achieved: number
  min: number
  max: number
}

export interface ScoreBreakdown {
  categories: CategoryResult[]
  total: number
}

export interface LoanResult {
  emi: number
  valueOfCar: number
  ltvPercent: number
  emiNmiPercent: number
  breakdown: ScoreBreakdown
  total: number
  approved: boolean
  suggestions: Suggestion[]
}

export interface Suggestion {
  loanAmount: number
  tenure: number
  nmi: number
  leverCount: number
  magnitude: number
  result: Omit<LoanResult, 'suggestions'>
}
