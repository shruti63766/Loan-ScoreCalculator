import type { LoanInputs, LoanResult } from '../../engine'
import { formatINR } from '../../format'
import { ApprovalBadge } from '../ApprovalBadge/ApprovalBadge'
import { ReferenceTable } from '../ReferenceTable/ReferenceTable'
import { ScoreExplorer } from '../ScoreExplorer/ScoreExplorer'
import { ScoreTable } from '../ScoreTable/ScoreTable'
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
          {formatINR(result.emi)}
          <span className={styles.emiSuffix}>/month</span>
        </span>
      </div>

      <ApprovalBadge total={result.total} approved={result.approved} />

      <ScoreTable categories={result.breakdown.categories} total={result.total} />

      <ScoreExplorer inputs={inputs} suggestions={result.suggestions} />

      <ReferenceTable />

      <button type="button" className={styles.backBtn} onClick={onRecalculate}>
        Recalculate
      </button>
    </div>
  )
}
