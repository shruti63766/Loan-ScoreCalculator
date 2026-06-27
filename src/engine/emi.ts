/** Standard reducing-balance EMI. Falls back to straight-line repayment at 0% interest. */
export function calculateEMI(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (tenureMonths <= 0 || principal <= 0) return 0

  const monthlyRate = annualRatePercent / 12 / 100
  if (monthlyRate === 0) return principal / tenureMonths

  const factor = Math.pow(1 + monthlyRate, tenureMonths)
  return (principal * monthlyRate * factor) / (factor - 1)
}
