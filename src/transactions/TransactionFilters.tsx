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
    <div className="filters">
      <label>
        Année
        <select
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
      </label>

      <label>
        Mois
        {/* When the year is "Tout", the month is forced to "Tout" too. */}
        <select
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
      </label>

      <label>
        Client
        <select
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
      </label>

      <label className="grow">
        Recherche
        <input
          type="search"
          placeholder="Prestation, marchandise, note…"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </label>

      <button type="button" className="reset" onClick={onReset}>
        Réinitialiser
      </button>
    </div>
  )
}
