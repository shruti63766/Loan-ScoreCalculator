import type { LoanInputs, LoanResult } from '../../engine'
import { ApprovalBadge } from '../ApprovalBadge/ApprovalBadge'
import { ScoreTable } from '../ScoreTable/ScoreTable'
import { SuggestionsList } from '../SuggestionsList/SuggestionsList'
import styles from './ResultsScreen.module.css'

interface Props {
  inputs: LoanInputs
  result: LoanResult
  onRecalculate: () => void
}

export function ResultsScreen({ inputs, result, onRecalculate }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.emiBanner}>
        <span className={styles.emiLabel}>EMI Proposed</span>
        <span className={styles.emiValue}>
          Rs. {Math.round(result.emi).toLocaleString('en-IN')}
          <span className={styles.emiSuffix}>/month</span>
        </span>
      </div>

      <ApprovalBadge total={result.total} approved={result.approved} />

      <ScoreTable categories={result.breakdown.categories} total={result.total} />

      {!result.approved && <SuggestionsList suggestions={result.suggestions} original={inputs} />}

      <button type="button" className={styles.backBtn} onClick={onRecalculate}>
        Recalculate
      </button>
    </div>
  )
}
