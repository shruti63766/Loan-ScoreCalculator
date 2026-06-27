import { EMI_NMI_TARGET_RATIOS, LOAN_AMOUNT_BOUNDARIES, TENURE_BOUNDARIES } from '../constants'

const roundDownToNearest1000 = (v: number): number => Math.floor(v / 1000) * 1000
const roundUpToNearest100 = (v: number): number => Math.ceil(v / 100) * 100

/** Loan Amount only ever moves down. Tests "just inside" every band boundary below the current value. */
export function generateLoanAmountCandidates(currentLoanAmount: number): number[] {
  const candidates = new Set<number>([currentLoanAmount])
  for (const boundary of LOAN_AMOUNT_BOUNDARIES) {
    if (boundary < currentLoanAmount) {
      candidates.add(roundDownToNearest1000(boundary - 1))
    }
  }
  return Array.from(candidates).filter((v) => v > 0)
}

/** Tenure can move either direction — shortening improves the Tenure score but raises EMI;
 * lengthening does the opposite. Test just inside every fixed band boundary both ways. */
export function generateTenureCandidates(currentTenure: number): number[] {
  const candidates = new Set<number>([currentTenure])
  for (const boundary of TENURE_BOUNDARIES) {
    candidates.add(boundary)
    candidates.add(boundary - 1)
  }
  return Array.from(candidates).filter((v) => v > 0)
}

/** Solves backwards for the minimum NMI that would reach a better EMI/NMI band, given a
 * specific EMI (which itself depends on the Loan Amount/Tenure candidate being evaluated). */
export function generateNmiCandidates(emi: number, currentNmi: number): number[] {
  const candidates = new Set<number>([currentNmi])
  for (const targetRatioPercent of EMI_NMI_TARGET_RATIOS) {
    const requiredNmi = emi / (targetRatioPercent / 100)
    if (requiredNmi > currentNmi) {
      candidates.add(roundUpToNearest100(requiredNmi))
    }
  }
  return Array.from(candidates).filter((v) => v > 0)
}
