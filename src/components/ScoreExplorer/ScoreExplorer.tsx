import { useMemo, useState } from 'react'
import { computeResult, type LoanInputs, type Suggestion } from '../../engine'
import { formatINR } from '../../format'
import styles from './ScoreExplorer.module.css'

interface Range {
  min: number
  max: number
  step: number
}

function loanAmountRange(original: number): Range {
  const min = Math.max(0, Math.round((original * 0.1) / 1000) * 1000)
  return { min: Math.min(min, original), max: original, step: 1000 }
}

function tenureRange(original: number): Range {
  return { min: Math.min(6, original), max: Math.max(96, original), step: 1 }
}

function nmiRange(original: number): Range {
  const max = Math.max(Math.round((original * 3) / 500) * 500, original + 50_000)
  return { min: original, max, step: 500 }
}

interface Props {
  inputs: LoanInputs
  suggestions: Suggestion[]
}

export function ScoreExplorer({ inputs, suggestions }: Props) {
  const [loanAmount, setLoanAmount] = useState(inputs.loanAmount)
  const [tenure, setTenure] = useState(inputs.tenure)
  const [nmi, setNmi] = useState(inputs.nmi)

  const topSuggestion = suggestions[0]
  const isAtSuggestion =
    !!topSuggestion &&
    loanAmount === topSuggestion.loanAmount &&
    tenure === topSuggestion.tenure &&
    nmi === topSuggestion.nmi

  const useSuggestion = () => {
    if (!topSuggestion) return
    setLoanAmount(topSuggestion.loanAmount)
    setTenure(topSuggestion.tenure)
    setNmi(topSuggestion.nmi)
  }

  const loanRange = useMemo(() => loanAmountRange(inputs.loanAmount), [inputs.loanAmount])
  const tenRange = useMemo(() => tenureRange(inputs.tenure), [inputs.tenure])
  const nmiRangeVal = useMemo(() => nmiRange(inputs.nmi), [inputs.nmi])

  const live = useMemo(
    () => computeResult({ ...inputs, loanAmount, tenure, nmi }),
    [inputs, loanAmount, tenure, nmi],
  )

  const reset = () => {
    setLoanAmount(inputs.loanAmount)
    setTenure(inputs.tenure)
    setNmi(inputs.nmi)
  }

  const isAtOriginal = loanAmount === inputs.loanAmount && tenure === inputs.tenure && nmi === inputs.nmi
  const fillPercent = Math.max(0, Math.min(100, live.total))

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.heading}>Try different values</h2>
          <p className={styles.subheading}>Drag any slider — the score recalculates live.</p>
        </div>
        <div className={styles.headerActions}>
          {topSuggestion && !isAtSuggestion && (
            <button type="button" className={styles.suggestBtn} onClick={useSuggestion}>
              Use suggested fix
            </button>
          )}
          {!isAtOriginal && (
            <button type="button" className={styles.resetBtn} onClick={reset}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className={styles.gaugeRow}>
        <span className={`${styles.liveTotal} ${live.approved ? styles.good : styles.bad}`}>{live.total}</span>
        <span className={styles.outOf}>/100</span>
        <div className={styles.gaugeTrack}>
          <div
            className={`${styles.gaugeFill} ${live.approved ? styles.good : styles.bad}`}
            style={{ width: `${fillPercent}%` }}
          />
          <div className={styles.gaugeMarker} style={{ left: '41%' }}>
            <span className={styles.gaugeMarkerLabel}>41</span>
          </div>
        </div>
      </div>

      <div className={styles.slider}>
        <div className={styles.sliderLabelRow}>
          <span className={styles.sliderLabel}>Loan Amount</span>
          <span className={styles.sliderValue}>{formatINR(loanAmount)}</span>
        </div>
        <input
          type="range"
          min={loanRange.min}
          max={loanRange.max}
          step={loanRange.step}
          value={loanAmount}
          onChange={(e) => setLoanAmount(Number(e.target.value))}
        />
      </div>

      <div className={styles.slider}>
        <div className={styles.sliderLabelRow}>
          <span className={styles.sliderLabel}>Tenure</span>
          <span className={styles.sliderValue}>{tenure} months</span>
        </div>
        <input
          type="range"
          min={tenRange.min}
          max={tenRange.max}
          step={tenRange.step}
          value={tenure}
          onChange={(e) => setTenure(Number(e.target.value))}
        />
      </div>

      <div className={styles.slider}>
        <div className={styles.sliderLabelRow}>
          <span className={styles.sliderLabel}>Net Monthly Income</span>
          <span className={styles.sliderValue}>{formatINR(nmi)}</span>
        </div>
        <input
          type="range"
          min={nmiRangeVal.min}
          max={nmiRangeVal.max}
          step={nmiRangeVal.step}
          value={nmi}
          onChange={(e) => setNmi(Number(e.target.value))}
        />
      </div>

      <div className={styles.resultGrid}>
        <div className={styles.resultItem}>
          <span className={styles.resultLabel}>EMI</span>
          <span className={styles.resultValue}>{formatINR(live.emi)}</span>
        </div>
        <div className={styles.resultItem}>
          <span className={styles.resultLabel}>LTV</span>
          <span className={styles.resultValue}>{live.ltvPercent.toFixed(1)}%</span>
        </div>
        <div className={styles.resultItem}>
          <span className={styles.resultLabel}>EMI/NMI</span>
          <span className={styles.resultValue}>{live.emiNmiPercent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
