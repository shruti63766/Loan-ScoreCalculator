import type { LoanInputs, Suggestion } from '../../engine'
import { SuggestionCard } from './SuggestionCard'
import styles from './SuggestionsList.module.css'

interface Props {
  suggestions: Suggestion[]
  original: LoanInputs
}

export function SuggestionsList({ suggestions, original }: Props) {
  if (suggestions.length === 0) {
    return (
      <div className={styles.empty}>
        No combination of Loan Amount, Tenure, or Net Monthly Income within a reasonable range
        reaches the minimum score. Other factors (CIBIL, Employment, Age, CSP) would need to
        change instead.
      </div>
    )
  }

  return (
    <div className={styles.list}>
      <h2 className={styles.heading}>Ways to reach the minimum score</h2>
      <p className={styles.subheading}>
        Ranked by the smallest change needed — each shows the full recalculated result.
      </p>
      {suggestions.map((s, i) => (
        <SuggestionCard key={i} rank={i + 1} suggestion={s} original={original} />
      ))}
    </div>
  )
}
