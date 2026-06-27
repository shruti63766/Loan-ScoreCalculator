import { APPROVAL_THRESHOLD } from '../../engine'
import styles from './ApprovalBadge.module.css'

interface Props {
  total: number
  approved: boolean
}

export function ApprovalBadge({ total, approved }: Props) {
  return (
    <div className={`${styles.badge} ${approved ? styles.approved : styles.rejected}`}>
      <div className={styles.scoreCircle}>
        <span className={styles.scoreNumber}>{total}</span>
        <span className={styles.scoreOutOf}>/100</span>
      </div>
      <div>
        <p className={styles.status}>{approved ? 'Good — meets threshold' : 'Below threshold'}</p>
        <p className={styles.detail}>
          {approved
            ? `Score is at or above the minimum of ${APPROVAL_THRESHOLD}.`
            : `Needs ${APPROVAL_THRESHOLD - total} more point(s) to reach the minimum of ${APPROVAL_THRESHOLD}.`}
        </p>
      </div>
    </div>
  )
}
