// Low-level Google Sheets REST API v4 calls.
// Each function takes an OAuth access token (from the auth layer) and talks
// directly to Sheets — no backend involved.
// https://developers.google.com/sheets/api/reference/rest

import {
  COLUMN_SPAN,
  FIRST_DATA_ROW,
  SHEET_NAME,
  fromRow,
  toRow,
  type Transaction,
  type TransactionRecord,
} from './transaction'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID

// USER_ENTERED makes Sheets parse values the way the UI would (dates, numbers),
// rather than storing everything as raw strings.
const VALUE_INPUT = 'USER_ENTERED'

/** Build an A1 range, scoped to SHEET_NAME when one is configured. */
function range(a1: string): string {
  return SHEET_NAME ? `${SHEET_NAME}!${a1}` : a1
}

interface SheetsError {
  error?: { code: number; message: string; status: string }
}

/** Fetch wrapper that injects the bearer token and surfaces Sheets API errors. */
async function sheetsFetch<T>(
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

interface ValueRange {
  range: string
  majorDimension: string
  values?: string[][]
}

/** Read every transaction row from the sheet. */
export async function listTransactions(
  token: string,
): Promise<TransactionRecord[]> {
  const a1 = range(`A${FIRST_DATA_ROW}:H`)
  const data = await sheetsFetch<ValueRange>(
    `/values/${encodeURIComponent(a1)}`,
    token,
  )
  const rows = data.values ?? []
  return rows
    .map((row, i) => fromRow(row, FIRST_DATA_ROW + i))
    .filter((r): r is TransactionRecord => r !== null)
}

interface AppendResponse {
  updates: { updatedRange: string }
}

/** Append a new transaction as the next row. Returns it tagged with its row number. */
export async function appendTransaction(
  token: string,
  transaction: Transaction,
): Promise<TransactionRecord> {
  const a1 = range(COLUMN_SPAN)
  const result = await sheetsFetch<AppendResponse>(
    `/values/${encodeURIComponent(a1)}:append?valueInputOption=${VALUE_INPUT}&insertDataOption=INSERT_ROWS`,
    token,
    { method: 'POST', body: JSON.stringify({ values: [toRow(transaction)] }) },
  )
  return { ...transaction, row: parseAppendedRow(result.updates.updatedRange) }
}

/** Overwrite an existing transaction row in place. */
export async function updateTransaction(
  token: string,
  transaction: TransactionRecord,
): Promise<TransactionRecord> {
  const { row } = transaction
  const a1 = range(`A${row}:H${row}`)
  await sheetsFetch(
    `/values/${encodeURIComponent(a1)}?valueInputOption=${VALUE_INPUT}`,
    token,
    { method: 'PUT', body: JSON.stringify({ values: [toRow(transaction)] }) },
  )
  return transaction
}

/** Extract the row number from an A1 range like "Sheet1!A12:H12" or "A12:H12". */
function parseAppendedRow(updatedRange: string): number {
  const match = updatedRange.match(/[A-Z]+(\d+)/)
  return match ? Number(match[1]) : FIRST_DATA_ROW
}
