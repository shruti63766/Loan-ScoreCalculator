import { useState } from 'react'
import styles from './App.module.css'
import { EMPTY_DRAFT, LoanForm, type LoanFormDraft } from './components/LoanForm/LoanForm'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { computeResult, type LoanInputs, type LoanResult } from './engine'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'dark' ? 'dark' : 'light'
}

function App() {
  const [draft, setDraft] = useState<LoanFormDraft>(EMPTY_DRAFT)
  const [submitted, setSubmitted] = useState<{ inputs: LoanInputs; result: LoanResult } | null>(null)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#12141a' : '#2554c7')
  }

  const logout = async () => {
    try {
      // A plain fetch (not a full-page navigation) so the service worker's
      // cached-navigation handling can't intercept it before it reaches the network.
      await fetch('/cdn-cgi/access/logout', { credentials: 'include', cache: 'no-store' })
    } finally {
      // Force the next load to go to the network instead of the offline cache,
      // so the cleared session is actually re-checked at Cloudflare's edge.
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
      }
      window.location.href = '/'
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <button type="button" className={styles.logoutBtn} onClick={logout}>
            Log out
          </button>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
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
