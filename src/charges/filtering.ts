import type { ChargeRecord } from './charge'
import {
  currentMonthNumber,
  currentYear,
  matchesPeriod,
  normalizePeriod,
  yearsInDates,
} from '../lib/period'

// Re-exported so the filter component can keep importing from here.
export { ALL, MONTHS } from '../lib/period'

export interface Filters {
  /** A 'YYYY' string, or ALL. */
  year: string
  /** A month number '1'–'12', or ALL. */
  month: string
  /** Exact category, or '' for all categories. */
  category: string
  /** Free-text search across the text columns. */
  search: string
}

export function defaultFilters(): Filters {
  return {
    year: currentYear(),
    month: currentMonthNumber(),
    category: '',
    search: '',
  }
}

export function normalizeFilters(f: Filters): Filters {
  return normalizePeriod(f)
}

/** Years present in the data, newest first, for the year picker. */
export function yearsIn(rows: ChargeRecord[]): string[] {
  return yearsInDates(rows.map((r) => r.date))
}

/** Distinct categories present in the data, sorted (FR). */
export function categoriesIn(rows: ChargeRecord[]): string[] {
  const set = new Set<string>()
  for (const c of rows) {
    const name = c.category.trim()
    if (name) set.add(name)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Distinct suppliers present in the data, sorted (FR). */
export function suppliersIn(rows: ChargeRecord[]): string[] {
  const set = new Set<string>()
  for (const c of rows) {
    const name = c.supplier.trim()
    if (name) set.add(name)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}

export function applyFilters(
  rows: ChargeRecord[],
  f: Filters,
): ChargeRecord[] {
  const search = f.search.trim().toLowerCase()

  return rows.filter((c) => {
    if (!matchesPeriod(c.date, f.year, f.month)) return false

    if (f.category && c.category.toLowerCase() !== f.category.toLowerCase()) {
      return false
    }

    if (search) {
      const haystack =
        `${c.supplier} ${c.category} ${c.label} ${c.paymentType} ${c.notes}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }

    return true
  })
}

/** Sum the amounts over the given rows. */
export function totalAmount(rows: ChargeRecord[]): number {
  return rows.reduce((sum, c) => sum + (c.amount ?? 0), 0)
}
