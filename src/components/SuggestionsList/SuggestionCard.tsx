import type { LoanInputs, Suggestion } from '../../engine'
import styles from './SuggestionsList.module.css'

const inr = (v: number) => `Rs. ${Math.round(v).toLocaleString('en-IN')}`

interface LeverChangeProps {
  label: string
  before: string
  after: string
  changed: boolean
}

function LeverChange({ label, before, after, changed }: LeverChangeProps) {
  if (!changed) return null
  return (
    <div className={styles.lever}>
      <span className={styles.leverLabel}>{label}</span>
      <span className={styles.leverValue}>
        <span className={styles.leverBefore}>{before}</span>
        <span className={styles.leverArrow}>&rarr;</span>
        <span className={styles.leverAfter}>{after}</span>
      </span>
    </div>
  )
}

interface Props {
  rank: number
  suggestion: Suggestion
  original: LoanInputs
}

export function SuggestionCard({ rank, suggestion, original }: Props) {
  const { loanAmount, tenure, nmi, result } = suggestion

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.rankBadge}>Option {rank}</span>
        <span className={styles.newTotal}>New score: {result.total}</span>
      </div>

      <div className={styles.levers}>
        <LeverChange
          label="Loan Amount"
          before={inr(original.loanAmount)}
          after={inr(loanAmount)}
          changed={loanAmount !== original.loanAmount}
        />
        <LeverChange
          label="Tenure"
          before={`${original.tenure} mo`}
          after={`${tenure} mo`}
          changed={tenure !== original.tenure}
        />
        <LeverChange
          label="Net Monthly Income"
          before={inr(original.nmi)}
          after={inr(nmi)}
          changed={nmi !== original.nmi}
        />
      </div>

      <div className={styles.resultGrid}>
        <div className={styles.resultItem}>
          <span className={styles.resultLabel}>EMI</span>
          <span className={styles.resultValue}>{inr(result.emi)}</span>
        </div>
        <div className={styles.resultItem}>
          <span className={styles.resultLabel}>LTV</span>
          <span className={styles.resultValue}>{result.ltvPercent.toFixed(1)}%</span>
        </div>
        <div className={styles.resultItem}>
          <span className={styles.resultLabel}>EMI/NMI</span>
          <span className={styles.resultValue}>{result.emiNmiPercent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
