import type { ProduitRecord } from '../sheets/produit'
import {
  currentMonthNumber,
  currentYear,
  matchesPeriod,
  normalizePeriod,
  yearsInDates,
} from '../lib/period'

// Re-exported so the filter components can keep importing from here.
export { ALL, MONTHS } from '../lib/period'

export interface Filters {
  /** A 'YYYY' string, or ALL. */
  year: string
  /** A month number '1'–'12', or ALL. */
  month: string
  /** Exact client name, or '' for all clients. */
  client: string
  /** Free-text search across the text columns. */
  search: string
}

export function defaultFilters(): Filters {
  return {
    year: currentYear(),
    month: currentMonthNumber(),
    client: '',
    search: '',
  }
}

export function normalizeFilters(f: Filters): Filters {
  return normalizePeriod(f)
}

/** Years present in the data, newest first, for the year picker. */
export function yearsIn(rows: ProduitRecord[]): string[] {
  return yearsInDates(rows.map((r) => r.date))
}

/** Distinct client names present in the data, sorted (FR). */
export function clientsIn(rows: ProduitRecord[]): string[] {
  const set = new Set<string>()
  for (const t of rows) {
    const name = t.client.trim()
    if (name) set.add(name)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}

export function applyFilters(
  rows: ProduitRecord[],
  f: Filters,
): ProduitRecord[] {
  const search = f.search.trim().toLowerCase()

  return rows.filter((t) => {
    if (!matchesPeriod(t.date, f.year, f.month)) return false

    if (f.client && t.client.toLowerCase() !== f.client.toLowerCase()) {
      return false
    }

    if (search) {
      const haystack =
        `${t.client} ${t.services} ${t.goods} ${t.paymentType} ${t.notes}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }

    return true
  })
}

export interface Totals {
  /** Sum of "Facturé prestation". */
  services: number
  /** Sum of "Facturé marchandise". */
  goods: number
  /** services + goods. */
  total: number
}

/** Sum the billed amounts over the given rows, split by services and goods. */
export function totals(rows: ProduitRecord[]): Totals {
  let services = 0
  let goods = 0
  for (const t of rows) {
    services += t.servicesAmount ?? 0
    goods += t.goodsAmount ?? 0
  }
  return { services, goods, total: services + goods }
}
