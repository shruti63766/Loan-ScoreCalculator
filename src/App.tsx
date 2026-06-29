import { useEffect, useRef, useState } from 'react'
import styles from './App.module.css'
import { EMPTY_DRAFT, LoanForm, type LoanFormDraft } from './components/LoanForm/LoanForm'
import { ResultsScreen } from './components/ResultsScreen/ResultsScreen'
import { computeResult, type LoanInputs, type LoanResult } from './engine'

const IDLE_LOGOUT_MS = 15 * 60 * 1000
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const
const LAST_ACTIVITY_KEY = 'wheelscore:lastActivity'
/** Don't write to localStorage on every scroll tick — at most once per this interval. */
const ACTIVITY_WRITE_THROTTLE_MS = 5000

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'dark' ? 'dark' : 'light'
}

function App() {
  const [draft, setDraft] = useState<LoanFormDraft>(EMPTY_DRAFT)
  const [submitted, setSubmitted] = useState<{
    customerName: string
    mobileNumber: string
    inputs: LoanInputs
    result: LoanResult
  } | null>(null)
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
      // Clear the idle timestamp so the next fresh login doesn't immediately re-trigger
      // the "already idle too long" check and bounce the user straight back out.
      localStorage.removeItem(LAST_ACTIVITY_KEY)
      // Force the next load to go to the network instead of the offline cache,
      // so the cleared session is actually re-checked at Cloudflare's edge.
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
      }
      window.location.href = import.meta.env.BASE_URL
    }
  }

  // Cloudflare Access's own session timer lives at the edge and this app never makes
  // another network request after the initial load (fully offline-capable), so nothing
  // ever re-checks it. Track idle time in-app instead and call logout() directly.
  //
  // A plain setTimeout is not enough on mobile: when the screen locks or the app is
  // backgrounded, the OS suspends JS timers, so the countdown effectively pauses instead
  // of tracking wall-clock time. Persist a last-activity timestamp and re-check elapsed
  // real time on load and every time the app becomes visible again, so being away for
  // 15+ minutes always logs out even if the timer was frozen the whole time.
  const logoutRef = useRef(logout)
  logoutRef.current = logout

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let lastWrite = 0

    const readLast = (): number => Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0
    const writeNow = () => {
      const now = Date.now()
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
      lastWrite = now
    }

    // Log out if idle time is already used up; otherwise (re)schedule for the time left.
    const enforceIdle = () => {
      clearTimeout(timeoutId)
      const elapsed = Date.now() - readLast()
      if (elapsed >= IDLE_LOGOUT_MS) {
        logoutRef.current()
      } else {
        timeoutId = setTimeout(enforceIdle, IDLE_LOGOUT_MS - elapsed)
      }
    }

    const onActivity = () => {
      const now = Date.now()
      if (now - lastWrite > ACTIVITY_WRITE_THROTTLE_MS) writeNow()
      clearTimeout(timeoutId)
      timeoutId = setTimeout(enforceIdle, IDLE_LOGOUT_MS)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') enforceIdle()
    }

    // On load: if the stored timestamp is already older than the limit, log out at once.
    const last = readLast()
    if (last && Date.now() - last >= IDLE_LOGOUT_MS) {
      logoutRef.current()
      return
    }
    writeNow()
    timeoutId = setTimeout(enforceIdle, IDLE_LOGOUT_MS)

    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, onActivity)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      clearTimeout(timeoutId)
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, onActivity)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

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
        <h1 className={styles.title}>WheelScore</h1>
        <p className={styles.subtitle}>Shruti Gupta</p>
      </header>

      <main className={styles.main}>
        {submitted ? (
          <ResultsScreen
            customerName={submitted.customerName}
            mobileNumber={submitted.mobileNumber}
            inputs={submitted.inputs}
            result={submitted.result}
            onRecalculate={() => setSubmitted(null)}
          />
        ) : (
          <LoanForm
            draft={draft}
            onChange={setDraft}
            onSubmit={(inputs) =>
              setSubmitted({
                customerName: draft.customerName,
                mobileNumber: draft.mobileNumber,
                inputs,
                result: computeResult(inputs),
              })
            }
          />
        )}
      </main>

      <footer className={styles.footer}>Strictly for internal circulation only</footer>
    </div>
  )
}

export default App
