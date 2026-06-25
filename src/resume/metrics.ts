import type { ProduitRecord } from '../sheets/produit'
import type { ChargeRecord } from '../charges/charge'
import { MONTHS, dateParts } from '../lib/period'

export interface Summary {
  /** Sum of "Facturé prestation". */
  produitsServices: number
  /** Sum of "Facturé marchandise". */
  produitsGoods: number
  /** services + goods. */
  produitsTotal: number
  /** Sum of charge amounts. */
  chargesTotal: number
  /** produitsTotal − chargesTotal. */
  resultat: number
  /** resultat / produitsTotal as a fraction, or null when there's no revenue. */
  marge: number | null
  nbProduits: number
  nbCharges: number
  /** produitsTotal / nbProduits (average ticket). */
  panierMoyen: number
  /** Charges grouped by category, largest first, with share of total. */
  chargesByCategory: { category: string; amount: number; share: number }[]
}

/** Compute the summary over already period-filtered rows. */
export function summarize(
  produits: ProduitRecord[],
  charges: ChargeRecord[],
): Summary {
  let produitsServices = 0
  let produitsGoods = 0
  for (const p of produits) {
    produitsServices += p.servicesAmount ?? 0
    produitsGoods += p.goodsAmount ?? 0
  }
  const produitsTotal = produitsServices + produitsGoods

  let chargesTotal = 0
  const byCategory = new Map<string, number>()
  for (const c of charges) {
    const amount = c.amount ?? 0
    chargesTotal += amount
    const key = c.category.trim() || 'Sans catégorie'
    byCategory.set(key, (byCategory.get(key) ?? 0) + amount)
  }

  const resultat = produitsTotal - chargesTotal
  const nbProduits = produits.length

  const chargesByCategory = [...byCategory.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: chargesTotal > 0 ? amount / chargesTotal : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    produitsServices,
    produitsGoods,
    produitsTotal,
    chargesTotal,
    resultat,
    marge: produitsTotal > 0 ? resultat / produitsTotal : null,
    nbProduits,
    nbCharges: charges.length,
    panierMoyen: nbProduits > 0 ? produitsTotal / nbProduits : 0,
    chargesByCategory,
  }
}

export interface MonthRow {
  label: string
  produits: number
  charges: number
  resultat: number
}

/** Per-month produits/charges/résultat for a given year (full datasets in). */
export function monthlyBreakdown(
  produits: ProduitRecord[],
  charges: ChargeRecord[],
  year: string,
): MonthRow[] {
  const y = Number(year)
  return MONTHS.map((m) => {
    const mn = Number(m.value)
    let prod = 0
    for (const p of produits) {
      const d = dateParts(p.date)
      if (d && d.year === y && d.month === mn) {
        prod += (p.servicesAmount ?? 0) + (p.goodsAmount ?? 0)
      }
    }
    let chg = 0
    for (const c of charges) {
      const d = dateParts(c.date)
      if (d && d.year === y && d.month === mn) chg += c.amount ?? 0
    }
    return { label: m.label, produits: prod, charges: chg, resultat: prod - chg }
  })
}
