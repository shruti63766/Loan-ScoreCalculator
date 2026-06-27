import { useState } from 'react'
import styles from './App.module.css'
import { EMPTY_DRAFT, LoanForm, type LoanFormDraft } from './components/LoanForm/LoanForm'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { computeResult, type LoanInputs, type LoanResult } from './engine'

function App() {
  const [draft, setDraft] = useState<LoanFormDraft>(EMPTY_DRAFT)
  const [submitted, setSubmitted] = useState<{ inputs: LoanInputs; result: LoanResult } | null>(null)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Car Loan Score Calculator</h1>
        <p className={styles.subtitle}>Annexure-I &middot; Revised Car Loan Score Card (RSM)</p>
      </header>

      <main className={styles.main}>
        {submitted ? (
          <ResultsScreen
            inputs={submitted.inputs}
            result={submitted.result}
            onRecalculate={() => setSubmitted(null)}
          />
        ) : (
          <LoanForm
            draft={draft}
            onChange={setDraft}
            onSubmit={(inputs) => setSubmitted({ inputs, result: computeResult(inputs) })}
          />
        )}
      </main>

      <footer className={styles.footer}>Strictly for internal circulation only</footer>
    </div>
  )
}

export default App
