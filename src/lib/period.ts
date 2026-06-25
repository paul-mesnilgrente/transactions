// Shared year/month period filtering, used by both the Produits and Charges
// pages.

/** Sentinel meaning "no restriction" for the year/month dropdowns. */
export const ALL = 'all'

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

export interface Period {
  /** A 'YYYY' string, or ALL. */
  year: string
  /** A month number '1'–'12', or ALL. */
  month: string
}

/**
 * When the year is "Tout", the month is forced to "Tout" as well (you can't
 * pick a single month across all years).
 */
export function normalizePeriod<T extends Period>(f: T): T {
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

/** Years present in the given date strings, newest first. */
export function yearsInDates(dates: string[]): string[] {
  const set = new Set<string>()
  for (const d of dates) {
    const parts = dateParts(d)
    if (parts) set.add(String(parts.year))
  }
  return [...set].sort((a, b) => Number(b) - Number(a))
}

/**
 * Whether a date passes the year/month filter. An unparseable date can't be
 * placed in a period, so it fails while filtering by year or month.
 */
export function matchesPeriod(
  date: string,
  year: string,
  month: string,
): boolean {
  const yearAll = year === ALL
  const monthAll = month === ALL
  if (yearAll && monthAll) return true

  const parts = dateParts(date)
  if (!parts) return false
  if (!yearAll && parts.year !== Number(year)) return false
  if (!monthAll && parts.month !== Number(month)) return false
  return true
}
