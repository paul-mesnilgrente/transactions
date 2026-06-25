import type { ProduitsAcrossYears } from './metrics'

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/**
 * Grouped-by-month stacked bar chart: one stacked bar (Prestations +
 * Marchandises) per year within each month. Pure CSS, scrolls on small screens.
 */
export function ProduitsYearChart({ data }: { data: ProduitsAcrossYears }) {
  const max = Math.max(
    1,
    ...data.months.flatMap((m) =>
      m.cells.map((c) => c.prestations + c.marchandises),
    ),
  )

  return (
    <figure className="year-chart mb-0">
      <figcaption className="year-chart__legend">
        <span>
          <i className="year-chart__swatch year-chart__swatch--prest" />
          Prestations
        </span>
        <span>
          <i className="year-chart__swatch year-chart__swatch--march" />
          Marchandises
        </span>
      </figcaption>

      <div className="year-chart__scroll">
        <div
          className="year-chart__plot"
          role="img"
          aria-label="Produits par mois et par année, empilés prestations et marchandises"
        >
          {data.months.map((m) => (
            <div className="year-chart__month" key={m.label}>
              <div className="year-chart__bars">
                {m.cells.map((c) => {
                  const total = c.prestations + c.marchandises
                  const marchPct = total > 0 ? (c.marchandises / total) * 100 : 0
                  return (
                    <div
                      key={c.year}
                      className="year-chart__bar"
                      title={`${m.label} ${c.year} — Prestations ${money.format(c.prestations)} · Marchandises ${money.format(c.marchandises)} · Total ${money.format(total)}`}
                    >
                      <div
                        className="year-chart__stack"
                        style={{ height: `${(total / max) * 100}%` }}
                      >
                        <div
                          className="year-chart__seg year-chart__seg--march"
                          style={{ height: `${marchPct}%` }}
                        />
                        <div
                          className="year-chart__seg year-chart__seg--prest"
                          style={{ height: `${100 - marchPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="year-chart__years">
                {m.cells.map((c) => (
                  <span key={c.year} className="year-chart__year">
                    {c.year.slice(2)}
                  </span>
                ))}
              </div>
              <div className="year-chart__month-label">{m.label.slice(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>
    </figure>
  )
}
