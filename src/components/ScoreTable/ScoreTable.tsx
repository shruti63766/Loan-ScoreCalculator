import type { CategoryResult } from '../../engine'
import styles from './ScoreTable.module.css'

interface Props {
  categories: CategoryResult[]
  total: number
}

function strengthClass(achieved: number, min: number, max: number): string {
  if (max === min) return styles.neutral
  const ratio = (achieved - min) / (max - min)
  if (ratio >= 0.66) return styles.strong
  if (ratio >= 0.33) return styles.medium
  return styles.weak
}

export function ScoreTable({ categories, total }: Props) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.paramHeader}>Parameter</th>
            <th>Max</th>
            <th>Min</th>
            <th>Achieved</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.key}>
              <td className={styles.paramCell}>{c.label}</td>
              <td className={styles.numCell}>{c.max}</td>
              <td className={styles.numCell}>{c.min}</td>
              <td className={styles.numCell}>
                <span className={`${styles.pill} ${strengthClass(c.achieved, c.min, c.max)}`}>{c.achieved}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className={styles.paramCell}>Total</td>
            <td className={styles.numCell}>100</td>
            <td className={styles.numCell}>—</td>
            <td className={styles.numCell}>
              <span className={styles.totalPill}>{total}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
