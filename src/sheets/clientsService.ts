// Read/write the single-column "Clients" tab.

import { a1Range, sheetsFetch, VALUE_INPUT, type ValueRange } from './api'

/** Tab holding the client list (one name per row in column A). */
export const CLIENTS_SHEET_NAME = 'Clients'

/** First row holding a client name. Set to 1 if the tab has no header row. */
export const CLIENTS_FIRST_ROW = 2

const COLUMN = 'A'

/** Read the client names, trimmed, de-duplicated (case-insensitive) and sorted. */
export async function listClients(token: string): Promise<string[]> {
  const a1 = a1Range(CLIENTS_SHEET_NAME, `${COLUMN}${CLIENTS_FIRST_ROW}:${COLUMN}`)
  const data = await sheetsFetch<ValueRange>(
    `/values/${encodeURIComponent(a1)}`,
    token,
  )
  const names = (data.values ?? [])
    .map((row) => (row[0] ?? '').trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const unique: string[] = []
  for (const name of names) {
    const key = name.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(name)
    }
  }
  return unique.sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Append a new client name as the next row in the Clients tab. */
export async function appendClient(token: string, name: string): Promise<void> {
  const a1 = a1Range(CLIENTS_SHEET_NAME, `${COLUMN}:${COLUMN}`)
  await sheetsFetch(
    `/values/${encodeURIComponent(a1)}:append?valueInputOption=${VALUE_INPUT}&insertDataOption=INSERT_ROWS`,
    token,
    { method: 'POST', body: JSON.stringify({ values: [[name]] }) },
  )
}
