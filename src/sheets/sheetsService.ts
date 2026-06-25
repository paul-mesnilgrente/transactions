// Produit reads/writes against the Produits sheet.
// Each function takes an OAuth access token (from the auth layer) and talks
// directly to Sheets — no backend involved.

import {
  a1Range,
  getSheetId,
  sheetsFetch,
  VALUE_INPUT,
  type ValueRange,
} from './api'
import {
  COLUMN_SPAN,
  FIRST_DATA_ROW,
  SHEET_NAME,
  fromRow,
  toRow,
  type Produit,
  type ProduitRecord,
} from './produit'

/** Read every produit row from the sheet. */
export async function listProduits(
  token: string,
): Promise<ProduitRecord[]> {
  const a1 = a1Range(SHEET_NAME, `A${FIRST_DATA_ROW}:H`)
  const data = await sheetsFetch<ValueRange>(
    `/values/${encodeURIComponent(a1)}`,
    token,
  )
  const rows = data.values ?? []
  return rows
    .map((row, i) => fromRow(row, FIRST_DATA_ROW + i))
    .filter((r): r is ProduitRecord => r !== null)
}

interface AppendResponse {
  updates: { updatedRange: string }
}

/** Append a new produit as the next row. Returns it tagged with its row number. */
export async function appendProduit(
  token: string,
  produit: Produit,
): Promise<ProduitRecord> {
  const a1 = a1Range(SHEET_NAME, COLUMN_SPAN)
  const result = await sheetsFetch<AppendResponse>(
    `/values/${encodeURIComponent(a1)}:append?valueInputOption=${VALUE_INPUT}&insertDataOption=INSERT_ROWS`,
    token,
    { method: 'POST', body: JSON.stringify({ values: [toRow(produit)] }) },
  )
  return { ...produit, row: parseAppendedRow(result.updates.updatedRange) }
}

/** Overwrite an existing produit row in place. */
export async function updateProduit(
  token: string,
  produit: ProduitRecord,
): Promise<ProduitRecord> {
  const { row } = produit
  const a1 = a1Range(SHEET_NAME, `A${row}:H${row}`)
  await sheetsFetch(
    `/values/${encodeURIComponent(a1)}?valueInputOption=${VALUE_INPUT}`,
    token,
    { method: 'PUT', body: JSON.stringify({ values: [toRow(produit)] }) },
  )
  return produit
}

/** Extract the row number from an A1 range like "Produits!A12:H12" or "A12:H12". */
function parseAppendedRow(updatedRange: string): number {
  const match = updatedRange.match(/[A-Z]+(\d+)/)
  return match ? Number(match[1]) : FIRST_DATA_ROW
}

/**
 * Delete the given 1-based row entirely (rows below it shift up by one).
 * Callers must renumber any cached rows greater than `row`.
 */
export async function deleteProduit(
  token: string,
  row: number,
): Promise<void> {
  const sheetId = await getSheetId(token, SHEET_NAME)
  await sheetsFetch(':batchUpdate', token, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: row - 1, // API indices are 0-based, end-exclusive.
              endIndex: row,
            },
          },
        },
      ],
    }),
  })
}
