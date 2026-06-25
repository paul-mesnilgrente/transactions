import { ALL, MONTHS, type Filters } from './filtering'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  onReset: () => void
  categoryOptions: string[]
  yearOptions: string[]
}

export function ChargeFilters({
  filters,
  onChange,
  onReset,
  categoryOptions,
  yearOptions,
}: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  const years = [...yearOptions]
  if (filters.year !== ALL && !years.includes(filters.year)) {
    years.unshift(filters.year)
  }

  return (
    <div className="row g-2 align-items-end mb-3">
      <div className="col-6 col-md-auto">
        <label htmlFor="charge-filter-year" className="form-label small mb-1">
          Année
        </label>
        <select
          id="charge-filter-year"
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
        <label htmlFor="charge-filter-month" className="form-label small mb-1">
          Mois
        </label>
        <select
          id="charge-filter-month"
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
        <label htmlFor="charge-filter-category" className="form-label small mb-1">
          Catégorie
        </label>
        <select
          id="charge-filter-category"
          className="form-select"
          value={filters.category}
          onChange={(e) => set('category', e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md">
        <label htmlFor="charge-filter-search" className="form-label small mb-1">
          Recherche
        </label>
        <input
          id="charge-filter-search"
          type="search"
          className="form-control"
          placeholder="Fournisseur, libellé, note…"
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
