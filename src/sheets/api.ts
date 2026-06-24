// Shared low-level plumbing for the Google Sheets REST API v4.
// https://developers.google.com/sheets/api/reference/rest

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID

// USER_ENTERED makes Sheets parse values the way the UI would (dates, numbers),
// rather than storing everything as raw strings.
export const VALUE_INPUT = 'USER_ENTERED'

export interface ValueRange {
  range: string
  majorDimension: string
  values?: string[][]
}

/** Build an A1 range scoped to a sheet/tab name, quoted to allow spaces/accents. */
export function a1Range(sheetName: string, a1: string): string {
  if (!sheetName) return a1
  return `'${sheetName.replace(/'/g, "''")}'!${a1}`
}

interface SheetsError {
  error?: { code: number; message: string; status: string }
}

/** Fetch wrapper that injects the bearer token and surfaces Sheets API errors. */
export async function sheetsFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  if (!SPREADSHEET_ID) {
    throw new Error(
      'VITE_SPREADSHEET_ID is not set. Copy .env.example to .env.local and fill it in.',
    )
  }
  const res = await fetch(`${SHEETS_BASE}/${SPREADSHEET_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    let message = `Sheets API error ${res.status}`
    try {
      const body = (await res.json()) as SheetsError
      if (body.error?.message) message = body.error.message
    } catch {
      // Response body wasn't JSON; keep the status-based message.
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}
