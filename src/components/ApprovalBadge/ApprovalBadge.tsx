import type { EligibilityResult } from '../../engine'
import { APPROVAL_THRESHOLD } from '../../engine'
import styles from './ApprovalBadge.module.css'

interface Props {
  total: number
  approved: boolean
  eligibility: EligibilityResult
}

export function ApprovalBadge({ total, approved, eligibility }: Props) {
  const good = approved

  return (
    <div className={`${styles.badge} ${good ? styles.approved : styles.rejected}`}>
      <div className={styles.topRow}>
        <div className={styles.scoreCircle}>
          <span className={styles.scoreNumber}>{total}</span>
          <span className={styles.scoreOutOf}>/100</span>
        </div>
        <div>
          <p className={styles.status}>
            {!eligibility.eligible ? 'Not Eligible' : approved ? 'Good — meets threshold' : 'Below threshold'}
          </p>
          {eligibility.eligible && (
            <p className={styles.detail}>
              {approved
                ? `Score is at or above the minimum of ${APPROVAL_THRESHOLD}.`
                : `Needs ${APPROVAL_THRESHOLD - total} more point(s) to reach the minimum of ${APPROVAL_THRESHOLD}.`}
            </p>
          )}
        </div>
      </div>

      {!eligibility.eligible && (
        <ul className={styles.reasonsList}>
          {eligibility.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
