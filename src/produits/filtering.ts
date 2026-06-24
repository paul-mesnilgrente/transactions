import type { ProduitRecord } from '../sheets/produit'

/** Sentinel meaning "no restriction" for the year/month dropdowns. */
export const ALL = 'all'

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

export const MONTHS: { value: string; label: string }[] = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
]

export function currentYear(): string {
  return String(new Date().getFullYear())
}

export function currentMonthNumber(): string {
  return String(new Date().getMonth() + 1)
}

export function defaultFilters(): Filters {
  return {
    year: currentYear(),
    month: currentMonthNumber(),
    client: '',
    search: '',
  }
}

/**
 * When the year is "Tout", the month is forced to "Tout" as well (you can't
 * pick a single month across all years).
 */
export function normalizeFilters(f: Filters): Filters {
  if (f.year === ALL && f.month !== ALL) {
    return { ...f, month: ALL }
  }
  return f
}

/**
 * Extract {year, month} from the date string as it comes back from Sheets.
 * Handles ISO (2024-06-24) and French/numeric formats (24/06/2024, 24-6-24,
 * 24.06.2024). Returns null when the format isn't recognised.
 */
export function dateParts(
  raw: string,
): { year: number; month: number } | null {
  const s = raw.trim()
  if (!s) return null

  // ISO-ish: year first — 2024-06-24, 2024/6/2
  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]) }

  // Day first — 24/06/2024, 24-6-24, 24.06.2024
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  if (dmy) {
    let year = Number(dmy[3])
    if (year < 100) year += 2000
    return { year, month: Number(dmy[2]) }
  }

  return null
}

/** Years present in the data, newest first, for the year picker. */
export function yearsIn(rows: ProduitRecord[]): string[] {
  const set = new Set<string>()
  for (const t of rows) {
    const parts = dateParts(t.date)
    if (parts) set.add(String(parts.year))
  }
  return [...set].sort((a, b) => Number(b) - Number(a))
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
  const yearAll = f.year === ALL
  const monthAll = f.month === ALL

  return rows.filter((t) => {
    if (!yearAll || !monthAll) {
      const parts = dateParts(t.date)
      // An unparseable date can't be placed in a period, so hide it while
      // filtering by year or month.
      if (!parts) return false
      if (!yearAll && parts.year !== Number(f.year)) return false
      if (!monthAll && parts.month !== Number(f.month)) return false
    }

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
