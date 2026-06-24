import { ALL, MONTHS, type Filters } from './filtering'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  onReset: () => void
  clientOptions: string[]
  yearOptions: string[]
}

export function TransactionFilters({
  filters,
  onChange,
  onReset,
  clientOptions,
  yearOptions,
}: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  // Always offer the currently-selected year even if no row carries it yet.
  const years = [...yearOptions]
  if (filters.year !== ALL && !years.includes(filters.year)) {
    years.unshift(filters.year)
  }

  return (
    <div className="row g-2 align-items-end mb-3">
      <div className="col-6 col-md-auto">
        <label htmlFor="filter-year" className="form-label small mb-1">
          Année
        </label>
        <select
          id="filter-year"
          className="form-select"
          value={filters.year}
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
        <label htmlFor="filter-month" className="form-label small mb-1">
          Mois
        </label>
        {/* When the year is "Tout", the month is forced to "Tout" too. */}
        <select
          id="filter-month"
          className="form-select"
          value={filters.month}
          disabled={filters.year === ALL}
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

      <div className="col-12 col-md-auto">
        <label htmlFor="filter-client" className="form-label small mb-1">
          Client
        </label>
        <select
          id="filter-client"
          className="form-select"
          value={filters.client}
          onChange={(e) => set('client', e.target.value)}
        >
          <option value="">Tous les clients</option>
          {clientOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md">
        <label htmlFor="filter-search" className="form-label small mb-1">
          Recherche
        </label>
        <input
          id="filter-search"
          type="search"
          className="form-control"
          placeholder="Prestation, marchandise, note…"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>

      <div className="col-12 col-md-auto">
        <button
          type="button"
          className="btn btn-outline-secondary w-100"
          onClick={onReset}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  )
}
