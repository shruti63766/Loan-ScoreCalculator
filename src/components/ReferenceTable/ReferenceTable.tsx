import { useState } from 'react'
import { SCORECARD_REFERENCE } from '../../engine'
import styles from './ReferenceTable.module.css'

export function ReferenceTable() {
  const [open, setOpen] = useState(false)

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)}>
        <span>Scorecard reference (Annexure-I)</span>
        <span className={styles.chevron}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className={styles.body}>
          {SCORECARD_REFERENCE.map((category) => (
            <div key={category.key} className={styles.category}>
              <div className={styles.categoryHeader}>
                <span>{category.title}</span>
                <span className={styles.maxMin}>
                  Max {category.max} &middot; Min {category.min}
                </span>
              </div>
              <table className={styles.table}>
                <tbody>
                  {category.rows.map((row) => (
                    <tr key={row.label}>
                      <td className={styles.rowLabel}>{row.label}</td>
                      <td className={styles.rowScore}>{row.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
