import { useEffect, useMemo, useState } from 'react'
import { useSheets } from '../sheets/useSheets'
import { useCharges } from '../charges/useCharges'
import type { ProduitRecord } from '../sheets/produit'
import type { ChargeRecord } from '../charges/charge'
import { PeriodPicker } from '../components/PeriodPicker'
import {
  ALL,
  currentYear,
  matchesPeriod,
  yearsInDates,
  type Period,
} from '../lib/period'
import { monthlyBreakdown, produitsAcrossYears, summarize } from './metrics'
import { MonthlyChart } from './MonthlyChart'
import { ProduitsYearChart } from './ProduitsYearChart'

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

const percent = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

function signClass(value: number): string {
  return value < 0 ? 'text-danger' : 'text-success'
}

interface KpiProps {
  label: string
  value: string
  valueClass?: string
  hint?: string
}

function Kpi({ label, value, valueClass, hint }: KpiProps) {
  return (
    <div className="col-6 col-md-3">
      <div className="card card-body shadow-sm h-100">
        <div className="text-body-secondary small">{label}</div>
        <div className={`fs-4 fw-bold ${valueClass ?? ''}`}>{value}</div>
        {hint && <div className="small text-body-secondary">{hint}</div>}
      </div>
    </div>
  )
}

export function ResumePage() {
  const { list: listProduits } = useSheets()
  const { list: listCharges } = useCharges()

  const [produits, setProduits] = useState<ProduitRecord[]>([])
  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>({
    year: currentYear(),
    month: ALL,
  })

  useEffect(() => {
    let on = true
    setLoading(true)
    setError(null)
    Promise.allSettled([listProduits(), listCharges()]).then((results) => {
      if (!on) return
      const failed: string[] = []
      if (results[0].status === 'fulfilled') setProduits(results[0].value)
      else failed.push('produits')
      if (results[1].status === 'fulfilled') setCharges(results[1].value)
      else failed.push('charges')
      if (failed.length) {
        setError(`Impossible de charger : ${failed.join(', ')}`)
      }
      setLoading(false)
    })
    return () => {
      on = false
    }
  }, [listProduits, listCharges])

  const yearOptions = useMemo(
    () =>
      yearsInDates([
        ...produits.map((p) => p.date),
        ...charges.map((c) => c.date),
      ]),
    [produits, charges],
  )

  const summary = useMemo(() => {
    const fp = produits.filter((p) =>
      matchesPeriod(p.date, period.year, period.month),
    )
    const fc = charges.filter((c) =>
      matchesPeriod(c.date, period.year, period.month),
    )
    return summarize(fp, fc)
  }, [produits, charges, period])

  const monthly = useMemo(
    () =>
      period.year !== ALL && period.month === ALL
        ? monthlyBreakdown(produits, charges, period.year)
        : null,
    [produits, charges, period],
  )

  // Spans all years, independent of the period filter.
  const produitsAcross = useMemo(
    () => produitsAcrossYears(produits),
    [produits],
  )

  return (
    <section className="resume">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <PeriodPicker
        period={period}
        onChange={setPeriod}
        yearOptions={yearOptions}
      />

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <Kpi
              label="Produits"
              value={money.format(summary.produitsTotal)}
              hint={`Prest. ${money.format(summary.produitsServices)} · March. ${money.format(summary.produitsGoods)}`}
            />
            <Kpi
              label="Charges"
              value={money.format(summary.chargesTotal)}
              hint={`${summary.nbCharges} charge${summary.nbCharges > 1 ? 's' : ''}`}
            />
            <Kpi
              label="Résultat"
              value={money.format(summary.resultat)}
              valueClass={signClass(summary.resultat)}
              hint="Produits − Charges"
            />
            <Kpi
              label="Marge"
              value={summary.marge == null ? '—' : percent.format(summary.marge)}
              valueClass={
                summary.marge == null ? '' : signClass(summary.resultat)
              }
              hint={`${summary.nbProduits} produit${summary.nbProduits > 1 ? 's' : ''} · panier ${money.format(summary.panierMoyen)}`}
            />
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-5">
              <div className="card card-body shadow-sm h-100">
                <h2 className="h6">Produits</h2>
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr>
                      <td>Prestations</td>
                      <td className="text-end">
                        {money.format(summary.produitsServices)}
                      </td>
                    </tr>
                    <tr>
                      <td>Marchandises</td>
                      <td className="text-end">
                        {money.format(summary.produitsGoods)}
                      </td>
                    </tr>
                    <tr className="fw-bold">
                      <td>Total</td>
                      <td className="text-end">
                        {money.format(summary.produitsTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="card card-body shadow-sm h-100">
                <h2 className="h6">Charges par catégorie</h2>
                {summary.chargesByCategory.length === 0 ? (
                  <p className="text-body-secondary mb-0">Aucune charge.</p>
                ) : (
                  <table className="table table-sm mb-0">
                    <tbody>
                      {summary.chargesByCategory.map((c) => (
                        <tr key={c.category}>
                          <td>{c.category}</td>
                          <td className="text-end">{money.format(c.amount)}</td>
                          <td className="text-end text-body-secondary">
                            {percent.format(c.share)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {monthly && (
            <div className="card card-body shadow-sm mt-3">
              <h2 className="h6">Par mois — {period.year}</h2>
              <MonthlyChart rows={monthly} />
              <div className="table-responsive mt-3">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Mois</th>
                      <th className="text-end">Produits</th>
                      <th className="text-end">Charges</th>
                      <th className="text-end">Résultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => (
                      <tr key={m.label}>
                        <td>{m.label}</td>
                        <td className="text-end">{money.format(m.produits)}</td>
                        <td className="text-end">{money.format(m.charges)}</td>
                        <td className={`text-end ${signClass(m.resultat)}`}>
                          {money.format(m.resultat)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold">
                      <td>Total</td>
                      <td className="text-end">
                        {money.format(summary.produitsTotal)}
                      </td>
                      <td className="text-end">
                        {money.format(summary.chargesTotal)}
                      </td>
                      <td className={`text-end ${signClass(summary.resultat)}`}>
                        {money.format(summary.resultat)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {produits.length > 0 && (
            <div className="card card-body shadow-sm mt-3">
              <h2 className="h6">Produits par mois et par année</h2>
              <ProduitsYearChart data={produitsAcross} />
            </div>
          )}
        </>
      )}
    </section>
  )
}
