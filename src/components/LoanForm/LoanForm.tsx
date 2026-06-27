import { useState } from 'react'
import type { EmploymentType, LoanInputs } from '../../engine'
import { EMPLOYMENT_SCORES } from '../../engine'
import styles from './LoanForm.module.css'

export interface LoanFormDraft {
  cibilScore: string
  isNtc: boolean
  employment: EmploymentType
  exShowroomPrice: string
  registrationCharge: string
  insurance: string
  loanAmount: string
  tenure: string
  nmi: string
  rateOfInterest: string
  hasCsp: boolean
  age: string
}

export const EMPTY_DRAFT: LoanFormDraft = {
  cibilScore: '',
  isNtc: false,
  employment: 'PVT_SECTOR_SALARIED',
  exShowroomPrice: '',
  registrationCharge: '',
  insurance: '',
  loanAmount: '',
  tenure: '',
  nmi: '',
  rateOfInterest: '',
  hasCsp: false,
  age: '',
}

function toInputs(draft: LoanFormDraft): LoanInputs {
  const n = (v: string) => Number(v) || 0
  return {
    cibilScore: n(draft.cibilScore),
    isNtc: draft.isNtc,
    employment: draft.employment,
    exShowroomPrice: n(draft.exShowroomPrice),
    registrationCharge: n(draft.registrationCharge),
    insurance: n(draft.insurance),
    loanAmount: n(draft.loanAmount),
    tenure: n(draft.tenure),
    nmi: n(draft.nmi),
    rateOfInterest: n(draft.rateOfInterest),
    hasCsp: draft.hasCsp,
    age: n(draft.age),
  }
}

const EMPLOYMENT_OPTIONS = Object.entries(EMPLOYMENT_SCORES) as [EmploymentType, { score: number; label: string }][]

const isBlank = (s: string): boolean => s.trim() === ''

function FieldError({ message }: { message: string | null }) {
  if (!message) return null
  return <span className={styles.errorText}>{message}</span>
}

interface Props {
  draft: LoanFormDraft
  onChange: (draft: LoanFormDraft) => void
  onSubmit: (inputs: LoanInputs) => void
}

export function LoanForm({ draft, onChange, onSubmit }: Props) {
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const set = <K extends keyof LoanFormDraft>(key: K, value: LoanFormDraft[K]) => onChange({ ...draft, [key]: value })

  const valueOfCar =
    (Number(draft.exShowroomPrice) || 0) + (Number(draft.registrationCharge) || 0) + (Number(draft.insurance) || 0)

  const errors = {
    cibil: !draft.isNtc && (isBlank(draft.cibilScore) || Number(draft.cibilScore) <= 0) ? 'Required' : null,
    exShowroom: isBlank(draft.exShowroomPrice) || Number(draft.exShowroomPrice) <= 0 ? 'Required' : null,
    registration: isBlank(draft.registrationCharge) ? 'Required' : null,
    insurance: isBlank(draft.insurance) ? 'Required' : null,
    loanAmount: isBlank(draft.loanAmount) || Number(draft.loanAmount) <= 0 ? 'Required' : null,
    tenure: isBlank(draft.tenure) || Number(draft.tenure) <= 0 ? 'Required' : null,
    rate: isBlank(draft.rateOfInterest) ? 'Required' : null,
    nmi: isBlank(draft.nmi) || Number(draft.nmi) <= 0 ? 'Required' : null,
    age: isBlank(draft.age) || Number(draft.age) <= 0 ? 'Required' : null,
  }
  const isValid = Object.values(errors).every((e) => e === null)
  const showErrors = submitAttempted

  const inputClass = (hasError: boolean) => `${styles.input} ${showErrors && hasError ? styles.inputError : ''}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setSubmitAttempted(true)
      return
    }
    onSubmit(toInputs(draft))
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Applicant</h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="cibil">
            CIBIL Score
          </label>
          <div className={styles.cibilRow}>
            <input
              id="cibil"
              className={inputClass(!!errors.cibil)}
              type="number"
              inputMode="numeric"
              placeholder="e.g. 760"
              value={draft.cibilScore}
              disabled={draft.isNtc}
              onChange={(e) => set('cibilScore', e.target.value)}
            />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={draft.isNtc}
                onChange={(e) => set('isNtc', e.target.checked)}
              />
              NTC (New to Credit)
            </label>
          </div>
          <FieldError message={showErrors ? errors.cibil : null} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="employment">
            Employment Detail
          </label>
          <select
            id="employment"
            className={styles.input}
            value={draft.employment}
            onChange={(e) => set('employment', e.target.value as EmploymentType)}
          >
            {EMPLOYMENT_OPTIONS.map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="age">
              Age (years)
            </label>
            <input
              id="age"
              className={inputClass(!!errors.age)}
              type="number"
              inputMode="numeric"
              placeholder="e.g. 34"
              value={draft.age}
              onChange={(e) => set('age', e.target.value)}
            />
            <FieldError message={showErrors ? errors.age : null} />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>CSP (Salary Package) with Bank</span>
            <div className={styles.toggleRow}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${draft.hasCsp ? styles.toggleBtnActive : ''}`}
                onClick={() => set('hasCsp', true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${!draft.hasCsp ? styles.toggleBtnActive : ''}`}
                onClick={() => set('hasCsp', false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Car Value</h2>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="exShowroom">
              Ex-showroom price (Rs.)
            </label>
            <input
              id="exShowroom"
              className={inputClass(!!errors.exShowroom)}
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={draft.exShowroomPrice}
              onChange={(e) => set('exShowroomPrice', e.target.value)}
            />
            <FieldError message={showErrors ? errors.exShowroom : null} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="registration">
              Registration charge (Rs.)
            </label>
            <input
              id="registration"
              className={inputClass(!!errors.registration)}
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={draft.registrationCharge}
              onChange={(e) => set('registrationCharge', e.target.value)}
            />
            <FieldError message={showErrors ? errors.registration : null} />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="insurance">
            One year insurance (Rs.)
          </label>
          <input
            id="insurance"
            className={inputClass(!!errors.insurance)}
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={draft.insurance}
            onChange={(e) => set('insurance', e.target.value)}
          />
          <FieldError message={showErrors ? errors.insurance : null} />
        </div>
        {valueOfCar > 0 && (
          <p className={styles.computedHint}>Value of car: <strong>Rs. {valueOfCar.toLocaleString('en-IN')}</strong></p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Loan Details</h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="loanAmount">
            Loan Amount (Rs.)
          </label>
          <input
            id="loanAmount"
            className={inputClass(!!errors.loanAmount)}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 600000"
            value={draft.loanAmount}
            onChange={(e) => set('loanAmount', e.target.value)}
          />
          <FieldError message={showErrors ? errors.loanAmount : null} />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="tenure">
              Tenure (months)
            </label>
            <input
              id="tenure"
              className={inputClass(!!errors.tenure)}
              type="number"
              inputMode="numeric"
              placeholder="e.g. 60"
              value={draft.tenure}
              onChange={(e) => set('tenure', e.target.value)}
            />
            <FieldError message={showErrors ? errors.tenure : null} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="rate">
              Rate of Interest (% p.a.)
            </label>
            <input
              id="rate"
              className={inputClass(!!errors.rate)}
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="e.g. 9.5"
              value={draft.rateOfInterest}
              onChange={(e) => set('rateOfInterest', e.target.value)}
            />
            <FieldError message={showErrors ? errors.rate : null} />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="nmi">
            Net Monthly Income (Rs.)
          </label>
          <input
            id="nmi"
            className={inputClass(!!errors.nmi)}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 80000"
            value={draft.nmi}
            onChange={(e) => set('nmi', e.target.value)}
          />
          <FieldError message={showErrors ? errors.nmi : null} />
        </div>
      </section>

      {showErrors && !isValid && (
        <p className={styles.formError}>Please fill in all required fields above.</p>
      )}

      <button type="submit" className={styles.submitBtn}>
        Calculate Score
      </button>
    </form>
  )
}
