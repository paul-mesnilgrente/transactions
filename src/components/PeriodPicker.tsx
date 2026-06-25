import { ALL, MONTHS, normalizePeriod, type Period } from '../lib/period'

interface Props {
  period: Period
  onChange: (period: Period) => void
  yearOptions: string[]
}

export function PeriodPicker({ period, onChange, yearOptions }: Props) {
  const years = [...yearOptions]
  if (period.year !== ALL && !years.includes(period.year)) {
    years.unshift(period.year)
  }

  function set(key: keyof Period, value: string) {
    onChange(normalizePeriod({ ...period, [key]: value }))
  }

  return (
    <div className="row g-2 align-items-end mb-3">
      <div className="col-6 col-md-auto">
        <label htmlFor="period-year" className="form-label small mb-1">
          Année
        </label>
        <select
          id="period-year"
          className="form-select"
          value={period.year}
          onChange={(e) => set('year', e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
          <option value={ALL}>Tout</option>
        </select>
      </div>

      <div className="col-6 col-md-auto">
        <label htmlFor="period-month" className="form-label small mb-1">
          Mois
        </label>
        <select
          id="period-month"
          className="form-select"
          value={period.month}
          disabled={period.year === ALL}
          onChange={(e) => set('month', e.target.value)}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value={ALL}>Tout</option>
        </select>
      </div>
    </div>
  )
}
