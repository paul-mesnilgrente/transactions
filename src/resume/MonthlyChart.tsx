import type { MonthRow } from './metrics'

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** Grouped bar chart (Produits vs Charges) per month — pure CSS, no deps. */
export function MonthlyChart({ rows }: { rows: MonthRow[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.produits, r.charges]))

  return (
    <figure className="monthly-chart mb-0">
      <figcaption className="monthly-chart__legend">
        <span>
          <i className="monthly-chart__swatch monthly-chart__swatch--produits" />
          Produits
        </span>
        <span>
          <i className="monthly-chart__swatch monthly-chart__swatch--charges" />
          Charges
        </span>
      </figcaption>

      <div
        className="monthly-chart__plot"
        role="img"
        aria-label="Évolution mensuelle des produits et des charges"
      >
        {rows.map((r) => (
          <div
            key={r.label}
            className="monthly-chart__group"
            title={`${r.label} — Produits ${money.format(r.produits)} · Charges ${money.format(r.charges)} · Résultat ${money.format(r.resultat)}`}
          >
            <div
              className="monthly-chart__bar monthly-chart__bar--produits"
              style={{ height: `${(r.produits / max) * 100}%` }}
            />
            <div
              className="monthly-chart__bar monthly-chart__bar--charges"
              style={{ height: `${(r.charges / max) * 100}%` }}
            />
          </div>
        ))}
      </div>

      <div className="monthly-chart__labels" aria-hidden="true">
        {rows.map((r) => (
          <div key={r.label} className="monthly-chart__label">
            {r.label.slice(0, 3)}
          </div>
        ))}
      </div>
    </figure>
  )
}
